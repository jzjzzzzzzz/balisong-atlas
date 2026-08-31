import asyncio
import logging
import signal
import socket
from contextlib import suppress
from uuid import uuid4

from app.core.logging import configure_logging
from app.db.session import SessionFactory
from app.services.audit import record_audit
from worker.queue.postgres import PostgresJobQueue
from worker.runners.registry import get_handler

logger = logging.getLogger(__name__)


class Worker:
    def __init__(self) -> None:
        self.worker_id = f"{socket.gethostname()}-{uuid4().hex[:8]}"
        self.queue = PostgresJobQueue(self.worker_id)
        self.stopping = asyncio.Event()

    def stop(self) -> None:
        self.stopping.set()

    async def _heartbeat_loop(self, job_id) -> None:  # type: ignore[no-untyped-def]
        while True:
            await asyncio.sleep(15)
            async with SessionFactory() as heartbeat_session:
                await self.queue.heartbeat(heartbeat_session, job_id)
                await heartbeat_session.commit()

    async def run_once(self) -> bool:
        async with SessionFactory() as session:
            async with session.begin():
                recovered = await self.queue.recover_stale(session)
                if recovered:
                    logger.warning(
                        "stale_jobs_recovered",
                        extra={"recovered_count": recovered, "worker_id": self.worker_id},
                    )
                job = await self.queue.claim_next(session)
            if job is None:
                return False
            job_id = job.id
            job_type = job.job_type
            logger.info(
                "job_started",
                extra={
                    "job_id": str(job.id),
                    "job_type": job.job_type,
                    "worker_id": self.worker_id,
                },
            )
            heartbeat_task = asyncio.create_task(self._heartbeat_loop(job.id))
            try:
                handler = get_handler(job.job_type)
                result = await handler(session, job.payload_json)
                await session.refresh(job, attribute_names=["status"])
                if job.status == "cancelled":
                    await session.rollback()
                    logger.info("job_cancellation_observed", extra={"job_id": str(job_id)})
                    return True
                await self.queue.succeed(session, job)
                await record_audit(
                    session,
                    event_type="job_succeeded",
                    entity_type="job",
                    entity_id=job.id,
                    actor_id=None,
                    request_id=f"worker:{self.worker_id}",
                    after={"job_type": job.job_type, "result_status": result.get("status")},
                )
                await session.commit()
                logger.info(
                    "job_succeeded",
                    extra={"job_id": str(job.id), "result_status": result.get("status")},
                )
            except Exception as exc:
                await session.rollback()
                failed_job = await session.get(type(job), job_id)
                if failed_job is None:
                    raise RuntimeError(f"Claimed job disappeared: {job_id}") from exc
                await self.queue.fail(
                    session,
                    failed_job,
                    f"{type(exc).__name__}: job handler failed; sensitive details withheld",
                )
                await record_audit(
                    session,
                    event_type="job_failed",
                    entity_type="job",
                    entity_id=job_id,
                    actor_id=None,
                    request_id=f"worker:{self.worker_id}",
                    after={"job_type": job_type, "error_type": type(exc).__name__},
                )
                await session.commit()
                logger.error(
                    "job_failed",
                    extra={"job_id": str(job_id), "error_type": type(exc).__name__},
                )
            finally:
                heartbeat_task.cancel()
                with suppress(asyncio.CancelledError):
                    await heartbeat_task
            return True

    async def run(self) -> None:
        while not self.stopping.is_set():
            worked = await self.run_once()
            if not worked:
                with suppress(TimeoutError):
                    await asyncio.wait_for(self.stopping.wait(), timeout=1.5)


async def async_main() -> None:
    configure_logging()
    worker = Worker()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, worker.stop)
    await worker.run()


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
