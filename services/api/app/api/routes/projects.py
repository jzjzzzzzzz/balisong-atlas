from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func, select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import (
    ArtifactRecord,
    Asset,
    Claim,
    DesignFeature,
    Job,
    ResearchProject,
    SensitiveContentFlag,
    SourceRecord,
)
from app.schemas.domain import ProjectCreate, ProjectPatch, ProjectRead
from app.services.audit import record_audit

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=list[ProjectRead])
async def list_projects(session: SessionDep, user: CurrentUser) -> list[ProjectRead]:
    del user
    rows = list(await session.scalars(select(ResearchProject).order_by(ResearchProject.updated_at.desc())))
    return [ProjectRead.model_validate(item) for item in rows]


@router.post("/projects", response_model=ProjectRead, status_code=201)
async def create_project(payload: ProjectCreate, request: Request, session: SessionDep, user: CurrentUser) -> ProjectRead:
    existing = await session.scalar(select(ResearchProject).where(ResearchProject.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=409, detail="Project slug already exists")
    project = ResearchProject(**payload.model_dump(), status="draft", public_visibility=False, created_by=user.id)
    session.add(project)
    await session.flush()
    await record_audit(session, event_type="project_created", entity_type="research_project", entity_id=project.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return ProjectRead.model_validate(project)


@router.get("/projects/{project_id}")
async def get_project(project_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    project = await session.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(404, "Project not found")
    counts = {
        "artifacts": await session.scalar(select(func.count()).select_from(ArtifactRecord).where(ArtifactRecord.project_id == project_id)),
        "sources": await session.scalar(select(func.count()).select_from(SourceRecord).where(SourceRecord.project_id == project_id)),
        "processed_sources": await session.scalar(select(func.count()).select_from(SourceRecord).where(SourceRecord.project_id == project_id, SourceRecord.processing_status == "processed")),
        "accepted_claims": await session.scalar(select(func.count()).select_from(Claim).where(Claim.project_id == project_id, Claim.epistemic_status == "accepted")),
        "disputed_claims": await session.scalar(select(func.count()).select_from(Claim).where(Claim.project_id == project_id, Claim.epistemic_status == "disputed")),
        "images": await session.scalar(select(func.count()).select_from(Asset).where(Asset.project_id == project_id, Asset.asset_type == "image")),
        "rights_unknown": await session.scalar(select(func.count()).select_from(SourceRecord).where(SourceRecord.project_id == project_id, SourceRecord.rights_status == "unknown")),
        "sensitive_flags": await session.scalar(select(func.count()).select_from(SensitiveContentFlag).join(SourceRecord, SensitiveContentFlag.source_id == SourceRecord.id).where(SourceRecord.project_id == project_id)),
        "visual_features": await session.scalar(select(func.count()).select_from(DesignFeature).where(DesignFeature.project_id == project_id)),
    }
    recent_jobs = list(await session.scalars(select(Job).order_by(Job.created_at.desc()).limit(8)))
    return {**row_dict(project), "counts": counts, "recent_jobs": [row_dict(job) for job in recent_jobs]}


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def patch_project(project_id: UUID, payload: ProjectPatch, request: Request, session: SessionDep, user: CurrentUser) -> ProjectRead:
    project = await session.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(404, "Project not found")
    before = row_dict(project)
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(project, key, value)
    await record_audit(session, event_type="project_updated", entity_type="research_project", entity_id=project.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return ProjectRead.model_validate(project)


@router.post("/projects/{project_id}/publish")
async def publish_project(project_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if user.role != "admin":
        raise HTTPException(403, "Only an administrator can publish an exhibit")
    from app.services.publication.database_validator import validate_project_publication

    project = await session.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(404, "Project not found")
    blockers = await validate_project_publication(session, project_id)
    if blockers:
        raise HTTPException(409, detail={"message": "Publication blocked", "blockers": [blocker.__dict__ for blocker in blockers]})
    project.status = "published"
    project.public_visibility = True
    await record_audit(session, event_type="published", entity_type="research_project", entity_id=project.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return {"published": True, "blockers": []}


@router.post("/projects/{project_id}/unpublish")
async def unpublish_project(project_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, bool]:
    if user.role != "admin":
        raise HTTPException(403, "Only an administrator can withdraw an exhibit")
    project = await session.get(ResearchProject, project_id)
    if project is None:
        raise HTTPException(404, "Project not found")
    project.status = "reviewing"
    project.public_visibility = False
    await record_audit(session, event_type="withdrawn", entity_type="research_project", entity_id=project.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return {"published": False}
