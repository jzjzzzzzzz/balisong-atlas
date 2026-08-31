from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Job


async def enqueue_job(
    session: AsyncSession,
    job_type: str,
    payload: dict[str, Any],
    idempotency_key: str,
    priority: int = 0,
    max_attempts: int = 3,
) -> Job:
    existing = await session.scalar(select(Job).where(Job.idempotency_key == idempotency_key))
    if existing:
        return existing
    job = Job(
        job_type=job_type,
        payload_json=payload,
        idempotency_key=idempotency_key,
        status="queued",
        priority=priority,
        attempts=0,
        max_attempts=max_attempts,
        run_after=datetime.now(timezone.utc),
    )
    session.add(job)
    await session.flush()
    return job
