import json
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import Asset, ImageObservation
from app.schemas.domain import ObservationCreate, ObservationPatch
from app.services.audit import record_audit
from app.services.ingestion.sensitive import contains_blocked_content
from app.services.rights.rights_gate import evaluate_rights
from app.services.storage.factory import get_storage

router = APIRouter(tags=["assets and image observations"])


@router.get("/public/assets/{asset_id}", response_class=Response)
async def get_public_asset(asset_id: UUID, session: SessionDep) -> Response:
    asset = await session.get(Asset, asset_id)
    if asset is None or not asset.public_display_allowed:
        raise HTTPException(404, "Public asset not found")
    rights = evaluate_rights(asset.rights_status, asset.attribution_text)
    if not rights.may_display_original:
        raise HTTPException(404, "Public asset not found")
    if asset.is_synthetic and not asset.synthetic_label:
        raise HTTPException(409, "Synthetic asset is missing its public label")
    content = await get_storage().get(asset.storage_key)
    return Response(
        content=content,
        media_type=asset.mime_type,
        headers={
            "Cache-Control": "private, max-age=300",
            "X-Atlas-Asset-Policy": "controlled-inline-display",
        },
    )


@router.get("/projects/{project_id}/assets")
async def list_assets(project_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(Asset).where(Asset.project_id == project_id)))
    return [row_dict(item) for item in rows]


@router.get("/assets/{asset_id}")
async def get_asset(asset_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    asset = await session.get(Asset, asset_id)
    if asset is None:
        raise HTTPException(404, "Asset not found")
    observations = list(await session.scalars(select(ImageObservation).where(ImageObservation.asset_id == asset_id)))
    return {**row_dict(asset), "observations": [row_dict(item) for item in observations]}


@router.post("/assets/{asset_id}/observations", status_code=201)
async def create_observation(asset_id: UUID, payload: ObservationCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if await session.get(Asset, asset_id) is None:
        raise HTTPException(404, "Asset not found")
    observation = ImageObservation(asset_id=asset_id, **payload.model_dump(), review_status="proposed")
    session.add(observation)
    await session.flush()
    await record_audit(session, event_type="observation_proposed", entity_type="image_observation", entity_id=observation.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return row_dict(observation)


@router.patch("/observations/{observation_id}")
async def patch_observation(observation_id: UUID, payload: ObservationPatch, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    observation = await session.get(ImageObservation, observation_id)
    if observation is None:
        raise HTTPException(404, "Observation not found")
    before = row_dict(observation)
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(observation, key, value)
    observation.review_status = "needs_revision"
    await record_audit(session, event_type="observation_modified", entity_type="image_observation", entity_id=observation.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return row_dict(observation)


async def _review(observation_id: UUID, status: str, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if user.role not in {"admin", "reviewer"}:
        raise HTTPException(403, "A reviewer or administrator role is required")
    observation = await session.get(ImageObservation, observation_id)
    if observation is None:
        raise HTTPException(404, "Observation not found")
    observation.review_status = status
    observation.reviewer_id = user.id
    await record_audit(session, event_type=f"observation_{status}", entity_type="image_observation", entity_id=observation.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return row_dict(observation)


@router.post("/observations/{observation_id}/accept")
async def accept_observation(observation_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _review(observation_id, "accepted", request, session, user)


@router.post("/observations/{observation_id}/reject")
async def reject_observation(observation_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _review(observation_id, "rejected", request, session, user)

@router.post("/assets/{asset_id}/observations/propose", status_code=201)
async def propose_observations(
    asset_id: UUID,
    request: Request,
    session: SessionDep,
    user: CurrentUser,
) -> dict[str, Any]:
    import hashlib
    from datetime import datetime, timezone

    from app.ai.prompts.loader import load_prompt
    from app.ai.providers.factory import get_ai_provider
    from app.ai.schemas.tasks import ImageObservationOutput
    from app.models.domain import ModelRun
    from app.services.storage.factory import get_storage

    asset = await session.get(Asset, asset_id)
    if asset is None or not asset.mime_type.startswith("image/"):
        raise HTTPException(404, "Image asset not found")
    image = await get_storage().get(asset.storage_key)
    prompt_template = load_prompt("image_observation.v1.txt")
    prompt = prompt_template.text
    provider = get_ai_provider()
    run = ModelRun(
        run_type="image_observation_proposal",
        provider="configured-provider",
        model="configured-vision-model",
        prompt_version=prompt_template.version,
        temperature=0,
        input_hash=hashlib.sha256(image + prompt.encode()).hexdigest(),
        input_summary=f"Image asset {asset.id}; binary content omitted from logs",
        output_json={},
        validation_status="running",
        started_at=datetime.now(timezone.utc),
    )
    session.add(run)
    await session.flush()
    try:
        output = await provider.analyze_image(image, prompt, ImageObservationOutput)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: image output request or validation failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise HTTPException(
            502, "AI image observation validation failed; no observations were written"
        ) from exc
    output_json = output.model_dump(mode="json")
    if contains_blocked_content(json.dumps(output_json, ensure_ascii=False)):
        run.output_json = {"discarded": True, "reason": "controlled_output"}
        run.validation_status = "failed_policy_validation"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise HTTPException(
            502, "AI image output failed policy validation; no observations were written"
        )
    run.output_json = output_json
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    observations: list[ImageObservation] = []
    for proposal in output.observations:
        if contains_blocked_content(proposal.description):
            continue
        observation = ImageObservation(
            asset_id=asset.id,
            artifact_id=asset.artifact_id,
            observation_type=proposal.observation_type,
            description=proposal.description,
            normalized_bbox_json=proposal.normalized_bbox,
            normalized_polygon_json=[],
            epistemic_state=proposal.epistemic_state,
            confidence=proposal.confidence,
            proposed_by="ai",
            review_status="proposed",
        )
        session.add(observation)
        observations.append(observation)
    await session.flush()
    await record_audit(
        session,
        event_type="ai_image_observation_extraction",
        entity_type="model_run",
        entity_id=run.id,
        actor_id=user.id,
        request_id=request.state.request_id,
        after={"proposals_created": len(observations), "status": "proposed"},
    )
    await session.commit()
    return {"model_run": row_dict(run), "observations": [row_dict(item) for item in observations]}
