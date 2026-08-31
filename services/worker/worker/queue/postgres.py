from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Job


class PostgresJobQueue:
    def __init__(self, worker_id: str, timeout_seconds: int = 300) -> None:
        self.worker_id = worker_id
        self.timeout_seconds = timeout_seconds

    async def claim_next(self, session: AsyncSession) -> Job | None:
        now = datetime.now(timezone.utc)
        query: Select[tuple[Job]] = (
            select(Job)
            .where(Job.status == "queued", Job.run_after <= now)
            .order_by(Job.priority.desc(), Job.created_at)
            .limit(1)
        )
        if session.bind and session.bind.dialect.name == "postgresql":
            query = query.with_for_update(skip_locked=True)
        job = await session.scalar(query)
        if job is None:
            return None
        job.status = "running"
        job.locked_at = now
        job.locked_by = self.worker_id
        job.heartbeat_at = now
        job.attempts += 1
        await session.flush()
        return job

    async def heartbeat(self, session: AsyncSession, job_id: UUID) -> None:
        job = await session.get(Job, job_id)
        if job and job.status == "running" and job.locked_by == self.worker_id:
            job.heartbeat_at = datetime.now(timezone.utc)

    async def succeed(self, session: AsyncSession, job: Job) -> None:
        job.status = "succeeded"
        job.completed_at = datetime.now(timezone.utc)
        job.locked_at = None
        job.locked_by = None

    async def fail(self, session: AsyncSession, job: Job, error: str) -> None:
        now = datetime.now(timezone.utc)
        job.last_error = error[:2000]
        job.locked_at = None
        job.locked_by = None
        if job.attempts >= job.max_attempts:
            job.status = "failed"
            job.completed_at = now
        else:
            job.status = "queued"
            delay = min(3600, 2 ** job.attempts * 5)
            job.run_after = now + timedelta(seconds=delay)

    async def recover_stale(self, session: AsyncSession) -> int:
        threshold = datetime.now(timezone.utc) - timedelta(seconds=self.timeout_seconds)
        query: Select[tuple[Job]] = select(Job).where(
            Job.status == "running", Job.heartbeat_at < threshold
        )
        if session.bind and session.bind.dialect.name == "postgresql":
            query = query.with_for_update(skip_locked=True)
        jobs = list(await session.scalars(query))
        for job in jobs:
            await self.fail(session, job, "Worker heartbeat timed out")
        return len(jobs)
