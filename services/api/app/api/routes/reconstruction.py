from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import (
    ArtifactRecord,
    Claim,
    DesignFeature,
    DesignFeatureEvidence,
    ImageObservation,
    ReconstructionHypothesis,
    ReconstructionVersion,
)
from app.schemas.domain import FeatureCreate, FeaturePatch, HypothesisCreate
from app.services.audit import record_audit
from app.services.jobs import enqueue_job
from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import (
    ReconstructionBriefV1,
)

router = APIRouter(tags=["reconstruction"])


@router.get("/artifacts/{artifact_id}/features")
async def list_features(artifact_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(DesignFeature).where(DesignFeature.artifact_id == artifact_id)))
    return [row_dict(item) for item in rows]


@router.post("/artifacts/{artifact_id}/features", status_code=201)
async def create_feature(artifact_id: UUID, payload: FeatureCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    artifact = await session.get(ArtifactRecord, artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    if not payload.evidence_claim_ids and not payload.evidence_observation_ids:
        raise HTTPException(422, "A design feature requires claim or observation evidence")
    data = payload.model_dump(exclude={"evidence_claim_ids", "evidence_observation_ids", "review_status"})
    feature = DesignFeature(project_id=artifact.project_id, artifact_id=artifact_id, **data, review_status="proposed")
    session.add(feature)
    await session.flush()
    for claim_id in payload.evidence_claim_ids:
        claim = await session.get(Claim, claim_id)
        if claim is None or claim.project_id != artifact.project_id:
            raise HTTPException(422, f"Unknown claim evidence: {claim_id}")
        session.add(DesignFeatureEvidence(design_feature_id=feature.id, claim_id=claim_id, evidence_weight=1.0, reviewer_verified=False))
    for observation_id in payload.evidence_observation_ids:
        observation = await session.get(ImageObservation, observation_id)
        if observation is None:
            raise HTTPException(422, f"Unknown observation evidence: {observation_id}")
        session.add(DesignFeatureEvidence(design_feature_id=feature.id, image_observation_id=observation_id, evidence_weight=1.0, reviewer_verified=False))
    await record_audit(session, event_type="design_feature_proposed", entity_type="design_feature", entity_id=feature.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return row_dict(feature)


@router.patch("/features/{feature_id}")
async def patch_feature(feature_id: UUID, payload: FeaturePatch, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    feature = await session.get(DesignFeature, feature_id)
    if feature is None:
        raise HTTPException(404, "Feature not found")
    before = row_dict(feature)
    changes = payload.model_dump(exclude_none=True)
    if changes.get("review_status") in {"accepted", "rejected"} and user.role not in {
        "admin",
        "reviewer",
    }:
        raise HTTPException(403, "A reviewer or administrator role is required")
    if changes.get("review_status") == "accepted":
        links = list(await session.scalars(select(DesignFeatureEvidence).where(DesignFeatureEvidence.design_feature_id == feature_id)))
        valid = False
        for link in links:
            if link.claim_id:
                claim = await session.get(Claim, link.claim_id)
                valid = valid or bool(claim and claim.epistemic_status == "accepted")
            if link.image_observation_id:
                observation = await session.get(ImageObservation, link.image_observation_id)
                valid = valid or bool(observation and observation.review_status == "accepted")
        if not valid:
            raise HTTPException(409, "Feature needs accepted claim or observation evidence before acceptance")
        for link in links:
            link.reviewer_verified = True
    for key, value in changes.items():
        setattr(feature, key, value)
    await record_audit(session, event_type="design_feature_updated", entity_type="design_feature", entity_id=feature.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return row_dict(feature)


@router.post("/artifacts/{artifact_id}/hypotheses", status_code=201)
async def create_hypothesis(artifact_id: UUID, payload: HypothesisCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    artifact = await session.get(ArtifactRecord, artifact_id)
    if artifact is None:
        raise HTTPException(404, "Artifact not found")
    hypothesis = ReconstructionHypothesis(
        project_id=artifact.project_id, artifact_id=artifact_id, created_by=user.id,
        generated_from_accepted_claims_only=True, status="draft", **payload.model_dump(),
    )
    session.add(hypothesis)
    await session.flush()
    await record_audit(session, event_type="reconstruction_hypothesis_created", entity_type="reconstruction_hypothesis", entity_id=hypothesis.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return row_dict(hypothesis)


@router.get("/hypotheses/{hypothesis_id}")
async def get_hypothesis(hypothesis_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    hypothesis = await session.get(ReconstructionHypothesis, hypothesis_id)
    if hypothesis is None:
        raise HTTPException(404, "Hypothesis not found")
    versions = list(await session.scalars(select(ReconstructionVersion).where(ReconstructionVersion.hypothesis_id == hypothesis_id).order_by(ReconstructionVersion.version_number.desc())))
    return {**row_dict(hypothesis), "versions": [row_dict(item) for item in versions]}


@router.post("/hypotheses/{hypothesis_id}/generate-brief", status_code=201)
async def generate_brief(hypothesis_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    hypothesis = await session.get(ReconstructionHypothesis, hypothesis_id)
    if hypothesis is None:
        raise HTTPException(404, "Hypothesis not found")
    from app.services.reconstruction.generator import generate_reconstruction_version

    try:
        version, report = await generate_reconstruction_version(session, hypothesis)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    await record_audit(
        session,
        event_type="reconstruction_brief_generated",
        entity_type="reconstruction_version",
        entity_id=version.id,
        actor_id=user.id,
        request_id=request.state.request_id,
        after={
            "version": version.version_number,
            "feature_count": len(version.reconstruction_brief_json.get("visual_features", [])),
            "validation": report["public_safety_validation_result"],
        },
    )
    await session.commit()
    return {"version": row_dict(version), "validation_report": report}


@router.post("/hypotheses/{hypothesis_id}/approve-brief")
async def approve_brief(hypothesis_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if user.role not in {"admin", "reviewer"}:
        raise HTTPException(403, "A reviewer or administrator role is required")
    hypothesis = await session.get(ReconstructionHypothesis, hypothesis_id)
    if hypothesis is None:
        raise HTTPException(404, "Hypothesis not found")
    version = await session.scalar(select(ReconstructionVersion).where(ReconstructionVersion.hypothesis_id == hypothesis_id).order_by(ReconstructionVersion.version_number.desc()))
    if version is None:
        raise HTTPException(409, "No brief version exists")
    brief = ReconstructionBriefV1.model_validate(version.reconstruction_brief_json)
    validation = SafeProxyBackend().validate_brief(brief)
    if not validation["valid"]:
        raise HTTPException(409, detail={"message": "Safety validation failed", "validation": validation})
    hypothesis.status = "approved"
    hypothesis.approved_by = user.id
    from datetime import datetime, timezone
    hypothesis.approved_at = datetime.now(timezone.utc)
    await record_audit(session, event_type="reconstruction_brief_approved", entity_type="reconstruction_version", entity_id=version.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return {"approved": True, "version_id": version.id, "validation": validation}


@router.post("/hypotheses/{hypothesis_id}/render-safe-proxy")
async def render_safe_proxy(hypothesis_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    hypothesis = await session.get(ReconstructionHypothesis, hypothesis_id)
    if hypothesis is None:
        raise HTTPException(404, "Hypothesis not found")
    if hypothesis.status != "approved":
        raise HTTPException(409, "Brief must be human-approved before a render job can be created")
    version = await session.scalar(select(ReconstructionVersion).where(ReconstructionVersion.hypothesis_id == hypothesis_id).order_by(ReconstructionVersion.version_number.desc()))
    if version is None:
        raise HTTPException(409, "No reconstruction version exists")
    job = await enqueue_job(session, "render_safe_proxy", {"hypothesis_id": str(hypothesis.id), "version_id": str(version.id)}, f"render-safe-proxy:{version.id}")
    await record_audit(session, event_type="safe_proxy_generation_requested", entity_type="reconstruction_version", entity_id=version.id, actor_id=user.id, request_id=request.state.request_id, after={"job_id": str(job.id)})
    await session.commit()
    return {"job": row_dict(job), "capability": SafeProxyBackend().capability()}


@router.get("/reconstructions/{reconstruction_id}")
async def get_reconstruction(reconstruction_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    version = await session.get(ReconstructionVersion, reconstruction_id)
    if version is None:
        raise HTTPException(404, "Reconstruction not found")
    return row_dict(version)


@router.get("/reconstructions/{reconstruction_id}/report")
async def reconstruction_report(reconstruction_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    version = await session.get(ReconstructionVersion, reconstruction_id)
    if version is None:
        raise HTTPException(404, "Reconstruction not found")
    brief = ReconstructionBriefV1.model_validate(version.reconstruction_brief_json)
    return SafeProxyBackend().create_validation_report(brief)
