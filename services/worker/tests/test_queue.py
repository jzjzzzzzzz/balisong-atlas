from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.domain import Job
from app.services.jobs import enqueue_job
from worker.queue.postgres import PostgresJobQueue


@pytest.fixture
async def session_factory():  # type: ignore[no-untyped-def]
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.mark.asyncio
async def test_job_claiming_is_exclusive_and_records_lock(session_factory) -> None:  # type: ignore[no-untyped-def]
    async with session_factory() as session:
        session.add(Job(job_type="parse_pdf", payload_json={}, idempotency_key="one", status="queued", priority=2, attempts=0, max_attempts=3, run_after=datetime.now(timezone.utc)))
        await session.commit()
    first = PostgresJobQueue("worker-one")
    second = PostgresJobQueue("worker-two")
    async with session_factory() as session:
        async with session.begin():
            claimed = await first.claim_next(session)
        assert claimed is not None
        assert claimed.locked_by == "worker-one"
    async with session_factory() as session, session.begin():
        assert await second.claim_next(session) is None


@pytest.mark.asyncio
async def test_retry_uses_exponential_backoff_then_dead_visibility(session_factory) -> None:  # type: ignore[no-untyped-def]
    queue = PostgresJobQueue("worker")
    async with session_factory() as session:
        job = Job(job_type="parse_pdf", payload_json={}, idempotency_key="retry", status="running", priority=0, attempts=1, max_attempts=2, run_after=datetime.now(timezone.utc), locked_by="worker")
        session.add(job)
        await session.flush()
        before = datetime.now(timezone.utc)
        await queue.fail(session, job, "first failure")
        assert job.status == "queued"
        assert job.run_after > before
        job.status = "running"
        job.attempts = 2
        await queue.fail(session, job, "second failure")
        assert job.status == "failed"
        assert job.completed_at is not None
        assert job.last_error == "second failure"


@pytest.mark.asyncio
async def test_idempotency_returns_existing_job(session_factory) -> None:  # type: ignore[no-untyped-def]
    async with session_factory() as session:
        first = await enqueue_job(session, "create_chunks", {"source": "one"}, "chunk:one")
        await session.commit()
        second = await enqueue_job(session, "create_chunks", {"source": "changed"}, "chunk:one")
        assert second.id == first.id
        assert second.payload_json == {"source": "one"}
