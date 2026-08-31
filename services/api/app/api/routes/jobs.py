from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import AuditEvent, Job
from app.services.audit import record_audit

router = APIRouter(tags=["jobs and audit"])


@router.get("/jobs")
async def list_jobs(session: SessionDep, user: CurrentUser, status: str | None = None) -> list[dict[str, Any]]:
    del user
    query = select(Job).order_by(Job.created_at.desc()).limit(200)
    if status:
        query = query.where(Job.status == status)
    return [row_dict(item) for item in await session.scalars(query)]


@router.get("/jobs/{job_id}")
async def get_job(job_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    job = await session.get(Job, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")
    return row_dict(job)


@router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    job = await session.get(Job, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")
    if job.status not in {"failed", "cancelled"}:
        raise HTTPException(409, "Only failed or cancelled jobs can be retried")
    job.status = "queued"
    job.attempts = 0
    job.run_after = datetime.now(timezone.utc)
    job.completed_at = None
    job.last_error = ""
    await record_audit(session, event_type="job_retried", entity_type="job", entity_id=job.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return row_dict(job)


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    job = await session.get(Job, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")
    if job.status not in {"queued", "running"}:
        raise HTTPException(409, "Only queued or running jobs can be cancelled")
    job.status = "cancelled"
    job.completed_at = datetime.now(timezone.utc)
    job.locked_at = None
    job.locked_by = None
    job.heartbeat_at = None
    await record_audit(session, event_type="job_cancelled", entity_type="job", entity_id=job.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return row_dict(job)


@router.get("/audit")
async def list_audit(session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    if user.role != "admin":
        raise HTTPException(403, "Only an administrator can read the complete audit log")
    rows = list(await session.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(300)))
    return [row_dict(item) for item in rows]
