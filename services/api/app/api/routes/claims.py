import hashlib
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func, select

from app.ai.guardrails.prompt_injection import isolate_untrusted_source
from app.ai.prompts.loader import load_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas.tasks import ClaimProposalOutput
from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import (
    Asset,
    Claim,
    ClaimEvidence,
    ImageObservation,
    ModelRun,
    SourceChunk,
    SourceRecord,
)
from app.schemas.domain import ClaimExtractionRequest, ClaimPatch, EvidenceCreate
from app.services.audit import record_audit
from app.services.evidence.claim_confidence_service import calculate_claim_confidence
from app.services.evidence.evidence_explanation_service import explain_score
from app.services.evidence.source_family_detector import SourceFingerprint, source_family_key
from app.services.ingestion.sensitive import contains_blocked_content

router = APIRouter(tags=["claims"])


@router.get("/projects/{project_id}/claims")
async def list_claims(project_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    claims = list(await session.scalars(select(Claim).where(Claim.project_id == project_id).order_by(Claim.created_at.desc())))
    output: list[dict[str, Any]] = []
    for claim in claims:
        evidence = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id)))
        evidence_output: list[dict[str, Any]] = []
        for item in evidence:
            source = await session.get(SourceRecord, item.source_id)
            family = (
                source_family_key(
                    SourceFingerprint(
                        canonical_url=source.canonical_url or source.original_url,
                        content_hash=source.content_sha256,
                        normalized_title=source.title,
                    )
                )
                if source
                else ""
            )
            evidence_output.append({
                **row_dict(item),
                "source_title": source.title if source else "",
                "source_tier": source.source_tier if source else "",
                "source_quality": source.source_quality_score if source else 0.0,
                "source_family": family,
                "rights_status": source.rights_status if source else "unknown",
            })
        model_run = await session.get(ModelRun, claim.model_run_id) if claim.model_run_id else None
        output.append({
            **row_dict(claim),
            "evidence_count": len(evidence),
            "evidence": evidence_output,
            "model_run": (
                {
                    "id": str(model_run.id),
                    "provider": model_run.provider,
                    "model": model_run.model,
                    "prompt_version": model_run.prompt_version,
                    "validation_status": model_run.validation_status,
                }
                if model_run
                else None
            ),
        })
    return output


@router.post("/projects/{project_id}/claims/extract", status_code=201)
async def extract_claims(project_id: UUID, payload: ClaimExtractionRequest, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    query = select(SourceChunk).where(SourceChunk.source_id == payload.source_id, SourceChunk.excluded_from_ai.is_(False))
    if payload.chunk_ids:
        query = query.where(SourceChunk.id.in_(payload.chunk_ids))
    chunks = list(await session.scalars(query.order_by(SourceChunk.chunk_index).limit(12)))
    if not chunks:
        raise HTTPException(409, "No public-safe, AI-eligible chunks are available")
    corpus_parts: list[str] = []
    chunk_lookup: dict[UUID, SourceChunk] = {}
    for chunk in chunks:
        isolated, _ = isolate_untrusted_source(chunk.public_safe_text)
        corpus_parts.append(f"chunk_id={chunk.id}\n{isolated}")
        chunk_lookup[chunk.id] = chunk
    prompt_template = load_prompt("claim_proposal.v1.txt")
    prompt = prompt_template.text + "\n" + "\n".join(corpus_parts)
    provider = get_ai_provider()
    started = datetime.now(timezone.utc)
    run = ModelRun(
        run_type="claim_proposal", provider="mock" if get_settings_mode() == "mock" else "openai-compatible",
        model="mock-evidence-v1" if get_settings_mode() == "mock" else "configured-live-model",
        prompt_version=prompt_template.version, temperature=0,
        input_hash=hashlib.sha256(prompt.encode()).hexdigest(),
        input_summary=f"{len(chunks)} redacted source chunks from source {payload.source_id}",
        output_json={}, validation_status="running", started_at=started,
    )
    session.add(run)
    await session.flush()
    try:
        output = await provider.generate_structured(prompt, ClaimProposalOutput)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: structured output request or validation failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise HTTPException(502, "AI structured output validation failed; no claims were written") from exc
    output_json = output.model_dump(mode="json")
    if contains_blocked_content(json.dumps(output_json, ensure_ascii=False)):
        run.output_json = {"discarded": True, "reason": "controlled_output"}
        run.validation_status = "failed_policy_validation"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise HTTPException(502, "AI output failed policy validation; no claims were written")
    run.output_json = output_json
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    created: list[Claim] = []
    for proposal in output.claims:
        if contains_blocked_content(
            " ".join([proposal.statement, *(span.short_excerpt for span in proposal.evidence_spans)])
        ):
            continue
        valid_spans = [span for span in proposal.evidence_spans if span.chunk_id in chunk_lookup]
        if not valid_spans:
            continue
        claim = Claim(
            project_id=project_id, artifact_id=payload.artifact_id, claim_type=proposal.claim_type,
            statement=proposal.statement, language="en", epistemic_status="proposed",
            confidence_score=proposal.certainty, confidence_label="medium" if proposal.certainty >= 0.45 else "low",
            proposed_by="ai", model_run_id=run.id,
        )
        session.add(claim)
        await session.flush()
        for span in valid_spans:
            chunk = chunk_lookup[span.chunk_id]
            session.add(ClaimEvidence(
                claim_id=claim.id, source_id=chunk.source_id, source_chunk_id=chunk.id,
                relation="supports", short_excerpt=span.short_excerpt[:500], page_number=chunk.page_number,
                section_title=chunk.section_title, bounding_box_json=chunk.bounding_box_json,
                evidence_directness=0.65, evidence_independence=0.5, reviewer_verified=False,
            ))
        created.append(claim)
    await record_audit(session, event_type="ai_claim_extraction", entity_type="model_run", entity_id=run.id, actor_id=user.id, request_id=request.state.request_id, after={"proposals_created": len(created), "status": "proposed"})
    await session.commit()
    return {"model_run": row_dict(run), "claims": [row_dict(item) for item in created]}


def get_settings_mode() -> str:
    from app.core.config import get_settings

    return get_settings().ai_mode


@router.get("/claims/{claim_id}")
async def get_claim(claim_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    claim = await session.get(Claim, claim_id)
    if claim is None:
        raise HTTPException(404, "Claim not found")
    evidence = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id)))
    return {**row_dict(claim), "evidence": [row_dict(item) for item in evidence]}


@router.patch("/claims/{claim_id}")
async def patch_claim(claim_id: UUID, payload: ClaimPatch, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    claim = await session.get(Claim, claim_id)
    if claim is None:
        raise HTTPException(404, "Claim not found")
    before = row_dict(claim)
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(claim, key, value)
    claim.epistemic_status = "proposed"
    claim.reviewer_id = None
    claim.reviewed_at = None
    await record_audit(session, event_type="claim_modified", entity_type="claim", entity_id=claim.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return row_dict(claim)


async def _review_claim(claim_id: UUID, status: str, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if user.role not in {"admin", "reviewer"}:
        raise HTTPException(403, "A reviewer or administrator role is required")
    claim = await session.get(Claim, claim_id)
    if claim is None:
        raise HTTPException(404, "Claim not found")
    if status == "accepted":
        verified = await session.scalar(select(func.count()).select_from(ClaimEvidence).where(ClaimEvidence.claim_id == claim_id, ClaimEvidence.reviewer_verified.is_(True)))
        if not verified:
            raise HTTPException(409, "A claim needs at least one reviewer-verified evidence link before acceptance")
    claim.epistemic_status = status
    claim.reviewer_id = user.id
    claim.reviewed_at = datetime.now(timezone.utc)
    await record_audit(session, event_type=f"claim_{status}", entity_type="claim", entity_id=claim.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return row_dict(claim)


@router.post("/claims/{claim_id}/accept")
async def accept_claim(claim_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _review_claim(claim_id, "accepted", request, session, user)


@router.post("/claims/{claim_id}/reject")
async def reject_claim(claim_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _review_claim(claim_id, "rejected", request, session, user)


@router.post("/claims/{claim_id}/dispute")
async def dispute_claim(claim_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _review_claim(claim_id, "disputed", request, session, user)


@router.post("/claims/{claim_id}/evidence", status_code=201)
async def add_evidence(claim_id: UUID, payload: EvidenceCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    claim = await session.get(Claim, claim_id)
    source = await session.get(SourceRecord, payload.source_id)
    if claim is None or source is None:
        raise HTTPException(404, "Claim or source not found")
    if source.project_id != claim.project_id:
        raise HTTPException(422, "Evidence source belongs to a different project")
    if payload.reviewer_verified and user.role not in {"admin", "reviewer"}:
        raise HTTPException(403, "Only a reviewer or administrator can verify evidence")
    chunk = await session.get(SourceChunk, payload.source_chunk_id) if payload.source_chunk_id else None
    if payload.source_chunk_id and (chunk is None or chunk.source_id != source.id):
        raise HTTPException(422, "Evidence chunk does not belong to the selected source")
    asset = await session.get(Asset, payload.asset_id) if payload.asset_id else None
    if payload.asset_id and (asset is None or asset.project_id != claim.project_id):
        raise HTTPException(422, "Evidence asset belongs to a different project")
    observation = (
        await session.get(ImageObservation, payload.image_observation_id)
        if payload.image_observation_id
        else None
    )
    if payload.image_observation_id:
        observation_asset = await session.get(Asset, observation.asset_id) if observation else None
        if observation is None or observation_asset is None or observation_asset.project_id != claim.project_id:
            raise HTTPException(422, "Evidence observation belongs to a different project")
    evidence_data = payload.model_dump()
    if chunk:
        excerpt = payload.short_excerpt.strip() or chunk.public_safe_text[:300]
        if excerpt not in chunk.public_safe_text:
            raise HTTPException(422, "Evidence excerpt must occur in the selected public-safe chunk")
        evidence_data["short_excerpt"] = excerpt
        evidence_data["page_number"] = payload.page_number or chunk.page_number
        evidence_data["section_title"] = payload.section_title or chunk.section_title
        evidence_data["bounding_box_json"] = payload.bounding_box_json or chunk.bounding_box_json
    evidence = ClaimEvidence(claim_id=claim_id, **evidence_data)
    session.add(evidence)
    score = calculate_claim_confidence(
        source_quality=source.source_quality_score, directness=payload.evidence_directness,
        independence=payload.evidence_independence, agreement=0.5, temporal_proximity=0.5,
        source_tier=source.source_tier, high_quality_conflict=payload.relation == "contradicts" and source.source_tier in {"A", "B"},
    )
    claim.confidence_score = score.score
    claim.confidence_label = score.label
    if score.disputed_queue:
        claim.epistemic_status = "disputed"
    await session.flush()
    await record_audit(session, event_type="claim_evidence_added", entity_type="claim_evidence", entity_id=evidence.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return {**row_dict(evidence), "confidence": explain_score(score)}


@router.get("/claims/{claim_id}/evidence")
async def claim_evidence(claim_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim_id)))
    return [row_dict(item) for item in rows]


@router.post("/claim-evidence/{evidence_id}/verify")
async def verify_claim_evidence(
    evidence_id: UUID,
    request: Request,
    session: SessionDep,
    user: CurrentUser,
) -> dict[str, Any]:
    if user.role not in {"admin", "reviewer"}:
        raise HTTPException(403, "A reviewer or administrator role is required")
    evidence = await session.get(ClaimEvidence, evidence_id)
    if evidence is None:
        raise HTTPException(404, "Evidence link not found")
    evidence.reviewer_verified = True
    await record_audit(
        session,
        event_type="claim_evidence_verified",
        entity_type="claim_evidence",
        entity_id=evidence.id,
        actor_id=user.id,
        request_id=request.state.request_id,
        after={"reviewer_verified": True},
    )
    await session.commit()
    return row_dict(evidence)
