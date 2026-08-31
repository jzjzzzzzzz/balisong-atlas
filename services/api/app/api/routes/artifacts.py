from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import ArtifactRecord, ArtifactSourceLink, Claim, ReconstructionHypothesis
from app.schemas.domain import ArtifactCreate, ArtifactPatch, ArtifactRead
from app.services.audit import record_audit

router = APIRouter(tags=["artifacts"])


@router.get("/projects/{project_id}/artifacts", response_model=list[ArtifactRead])
async def list_artifacts(project_id: UUID, session: SessionDep, user: CurrentUser) -> list[ArtifactRead]:
    del user
    rows = list(await session.scalars(select(ArtifactRecord).where(ArtifactRecord.project_id == project_id)))
    return [ArtifactRead.model_validate(item) for item in rows]


@router.post("/projects/{project_id}/artifacts", response_model=ArtifactRead, status_code=201)
async def create_artifact(project_id: UUID, payload: ArtifactCreate, request: Request, session: SessionDep, user: CurrentUser) -> ArtifactRead:
    artifact = ArtifactRecord(project_id=project_id, created_by=user.id, **payload.model_dump())
    session.add(artifact)
    await session.flush()
    await record_audit(session, event_type="artifact_created", entity_type="artifact_record", entity_id=artifact.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return ArtifactRead.model_validate(artifact)


@router.get("/artifacts/{artifact_id}")
async def get_artifact(artifact_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    artifact = await session.get(ArtifactRecord, artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    claims = list(await session.scalars(select(Claim).where(Claim.artifact_id == artifact_id)))
    return {**row_dict(artifact), "claims": [row_dict(claim) for claim in claims]}


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactRead)
async def patch_artifact(artifact_id: UUID, payload: ArtifactPatch, request: Request, session: SessionDep, user: CurrentUser) -> ArtifactRead:
    artifact = await session.get(ArtifactRecord, artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    before = row_dict(artifact)
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(artifact, key, value)
    await record_audit(session, event_type="artifact_updated", entity_type="artifact_record", entity_id=artifact.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return ArtifactRead.model_validate(artifact)


@router.get("/artifacts/{artifact_id}/evidence")
async def artifact_evidence(artifact_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    links = list(await session.scalars(select(ArtifactSourceLink).where(ArtifactSourceLink.artifact_id == artifact_id)))
    return [row_dict(item) for item in links]


@router.get("/artifacts/{artifact_id}/timeline")
async def artifact_timeline(artifact_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    claims = list(await session.scalars(select(Claim).where(Claim.artifact_id == artifact_id, Claim.epistemic_status == "accepted", Claim.claim_type.in_(["chronology", "design_change", "production"]))))
    return [{"id": claim.id, "label": claim.statement, "confidence": claim.confidence_score, "uncertainty": claim.confidence_label} for claim in claims]


@router.get("/artifacts/{artifact_id}/reconstructions")
async def artifact_reconstructions(artifact_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(ReconstructionHypothesis).where(ReconstructionHypothesis.artifact_id == artifact_id)))
    return [row_dict(item) for item in rows]
