import hashlib
import json
from datetime import datetime, timezone
from itertools import combinations
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.guardrails.prompt_injection import isolate_untrusted_source
from app.ai.prompts.loader import load_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas.tasks import ClaimProposalOutput, EntityExtractionOutput, ImageObservationOutput
from app.core.config import get_settings
from app.models.domain import (
    Asset,
    Claim,
    ClaimEvidence,
    Contradiction,
    Entity,
    ImageObservation,
    ModelRun,
    ReconstructionVersion,
    SensitiveContentFlag,
    SourceChunk,
    SourceRecord,
    SourceSnapshot,
)
from app.services.audit import record_audit
from app.services.evidence.claim_confidence_service import calculate_claim_confidence
from app.services.evidence.contradiction_detector import ClaimView, compare_claims
from app.services.evidence.source_family_detector import SourceFingerprint, source_family_key
from app.services.ingestion.sensitive import (
    contains_blocked_content,
    detect_sensitive_content,
    redact_controlled_text,
    redact_public_text,
)
from app.services.parsing.image_processor import perceptual_hash
from app.services.publication.database_validator import validate_project_publication
from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import ReconstructionBriefV1
from app.services.storage.factory import get_storage
from worker.runners.ingestion import ingest_source_handler


def _uuid(payload: dict[str, Any], key: str) -> UUID:
    value = payload.get(key)
    if not value:
        raise ValueError(f"Job payload requires {key}")
    return UUID(str(value))


async def source_stage_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    source_id = _uuid(payload, "source_id")
    snapshot_id = payload.get("snapshot_id")
    if snapshot_id is None:
        snapshot_id = await session.scalar(
            select(SourceSnapshot.id)
            .where(SourceSnapshot.source_id == source_id)
            .order_by(SourceSnapshot.created_at.desc())
        )
    if snapshot_id is None:
        raise ValueError("Source has no immutable snapshot to process")
    return await ingest_source_handler(
        session,
        {"source_id": str(source_id), "snapshot_id": str(snapshot_id)},
    )


async def sensitive_content_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    source_id = _uuid(payload, "source_id")
    chunks = list(
        await session.scalars(select(SourceChunk).where(SourceChunk.source_id == source_id))
    )
    created = 0
    has_measurement = False
    has_operational = False
    for chunk in chunks:
        detections = detect_sensitive_content(chunk.text)
        chunk.text = redact_controlled_text(chunk.text)
        chunk.public_safe_text = redact_public_text(chunk.text)
        chunk.text_search_vector = chunk.public_safe_text
        existing = set(
            await session.scalars(
                select(SensitiveContentFlag.category).where(
                    SensitiveContentFlag.source_chunk_id == chunk.id
                )
            )
        )
        categories = existing | {detection.category for detection in detections}
        chunk.contains_sensitive_content = bool(categories)
        controlled = bool(
            categories
            & {
                "exact_measurement",
                "manufacturing_instruction",
                "assembly_instruction",
                "operational_instruction",
                "purchasing_information",
            }
        )
        chunk.excluded_from_ai = controlled
        chunk.excluded_from_public_search = controlled
        has_measurement = has_measurement or "exact_measurement" in categories
        has_operational = has_operational or "operational_instruction" in categories
        for detection in detections:
            if detection.category in existing:
                continue
            session.add(
                SensitiveContentFlag(
                    source_id=source_id,
                    source_chunk_id=chunk.id,
                    category=detection.category,
                    detection_method="rule",
                    confidence=detection.confidence,
                    action=detection.action,
                    reviewer_status="proposed",
                )
            )
            created += 1
    source = await session.get(SourceRecord, source_id)
    if source:
        source.contains_sensitive_measurements = has_measurement
        source.contains_operational_content = has_operational
    return {"status": "processed", "chunks": len(chunks), "flags_created": created}


async def calculate_hashes_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    source_id = _uuid(payload, "source_id")
    snapshots = list(
        await session.scalars(select(SourceSnapshot).where(SourceSnapshot.source_id == source_id))
    )
    storage = get_storage()
    for snapshot in snapshots:
        content = await storage.get(snapshot.storage_key)
        digest = hashlib.sha256(content).hexdigest()
        if snapshot.sha256 and snapshot.sha256 != digest:
            raise ValueError("Immutable snapshot hash mismatch")
        snapshot.sha256 = digest
        snapshot.file_size = len(content)
    source = await session.get(SourceRecord, source_id)
    if source and snapshots:
        source.content_sha256 = snapshots[-1].sha256
    return {"status": "verified", "snapshots": len(snapshots)}


async def image_phash_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    asset_id = payload.get("asset_id")
    source_id = payload.get("source_id")
    query = select(Asset).where(Asset.mime_type.like("image/%"))
    if asset_id:
        query = query.where(Asset.id == UUID(str(asset_id)))
    elif source_id:
        query = query.where(Asset.source_id == UUID(str(source_id)))
    else:
        raise ValueError("Job payload requires asset_id or source_id")
    assets = list(await session.scalars(query))
    storage = get_storage()
    updated = 0
    for asset in assets:
        content = await storage.get(asset.storage_key)
        asset.perceptual_hash = perceptual_hash(content)
        asset.sha256 = hashlib.sha256(content).hexdigest()
        updated += 1
    return {"status": "processed", "assets": updated}


async def embeddings_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.embedding_enabled:
        return {"status": "capability_disabled", "reason": "EMBEDDING_ENABLED=false"}
    source_id = _uuid(payload, "source_id")
    chunks = list(
        await session.scalars(
            select(SourceChunk).where(
                SourceChunk.source_id == source_id,
                SourceChunk.excluded_from_ai.is_(False),
            )
        )
    )
    if not chunks:
        return {"status": "no_eligible_chunks", "embedded": 0}
    input_texts = [chunk.public_safe_text for chunk in chunks]
    run = ModelRun(
        run_type="embedding",
        provider="mock" if settings.ai_mode == "mock" else "openai-compatible",
        model=settings.embedding_model or "mock-embedding-v1",
        prompt_version="embedding-v1",
        temperature=0,
        input_hash=hashlib.sha256("\n".join(input_texts).encode()).hexdigest(),
        input_summary=f"{len(input_texts)} public-safe source chunks",
        output_json={},
        validation_status="running",
        started_at=datetime.now(timezone.utc),
    )
    session.add(run)
    await session.flush()
    try:
        vectors = await get_ai_provider().embed_text(input_texts)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: embedding request failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise
    if len(vectors) != len(chunks):
        raise ValueError("Embedding provider returned a mismatched vector count")
    for chunk, vector in zip(chunks, vectors, strict=True):
        if len(vector) != settings.embedding_dim:
            raise ValueError("Embedding provider returned a mismatched vector dimension")
        chunk.embedding = vector
        chunk.embedding_model = settings.embedding_model
    run.output_json = {"vector_count": len(vectors), "dimensions": settings.embedding_dim}
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    return {"status": "processed", "embedded": len(chunks), "model_run_id": str(run.id)}


def _model_run(
    run_type: str,
    prompt: str,
    summary: str,
    model: str,
    prompt_version: str,
) -> ModelRun:
    settings = get_settings()
    return ModelRun(
        run_type=run_type,
        provider="mock" if settings.ai_mode == "mock" else "openai-compatible",
        model=model,
        prompt_version=prompt_version,
        temperature=0,
        input_hash=hashlib.sha256(prompt.encode()).hexdigest(),
        input_summary=summary[:500],
        output_json={},
        validation_status="running",
        started_at=datetime.now(timezone.utc),
    )


async def _eligible_chunks(
    session: AsyncSession, source_id: UUID
) -> tuple[list[SourceChunk], str]:
    chunks = list(
        await session.scalars(
            select(SourceChunk)
            .where(
                SourceChunk.source_id == source_id,
                SourceChunk.excluded_from_ai.is_(False),
            )
            .order_by(SourceChunk.chunk_index)
            .limit(24)
        )
    )
    corpus: list[str] = []
    for chunk in chunks:
        isolated, _ = isolate_untrusted_source(chunk.public_safe_text)
        corpus.append(f"chunk_id={chunk.id}\n{isolated}")
    return chunks, "\n".join(corpus)


async def propose_claims_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    source_id = _uuid(payload, "source_id")
    artifact_id = UUID(str(payload["artifact_id"])) if payload.get("artifact_id") else None
    chunks, corpus = await _eligible_chunks(session, source_id)
    if not chunks:
        raise ValueError("No public-safe AI-eligible source chunks")
    prompt_template = load_prompt("claim_proposal.v1.txt")
    prompt = prompt_template.text + "\n" + corpus
    run = _model_run("claim_proposal", prompt, f"{len(chunks)} redacted chunks", get_settings().llm_model, prompt_template.version)
    session.add(run)
    await session.flush()
    try:
        output = await get_ai_provider().generate_structured(prompt, ClaimProposalOutput)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: structured output request or validation failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise
    output_json = output.model_dump(mode="json")
    if contains_blocked_content(json.dumps(output_json, ensure_ascii=False)):
        run.output_json = {"discarded": True, "reason": "controlled_output"}
        run.validation_status = "failed_policy_validation"
        run.completed_at = datetime.now(timezone.utc)
        return {"status": "validation_failed", "reason": "controlled_output"}
    run.output_json = output_json
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    lookup = {chunk.id: chunk for chunk in chunks}
    created = 0
    for proposal in output.claims:
        if contains_blocked_content(
            " ".join([proposal.statement, *(span.short_excerpt for span in proposal.evidence_spans)])
        ):
            continue
        spans = [span for span in proposal.evidence_spans if span.chunk_id in lookup]
        if not spans:
            continue
        claim = Claim(
            project_id=project_id,
            artifact_id=artifact_id,
            claim_type=proposal.claim_type,
            statement=proposal.statement,
            language="en",
            epistemic_status="proposed",
            confidence_score=proposal.certainty,
            confidence_label="medium" if proposal.certainty >= 0.45 else "low",
            proposed_by="ai",
            model_run_id=run.id,
        )
        session.add(claim)
        await session.flush()
        for span in spans:
            chunk = lookup[span.chunk_id]
            session.add(
                ClaimEvidence(
                    claim_id=claim.id,
                    source_id=source_id,
                    source_chunk_id=chunk.id,
                    relation="supports",
                    short_excerpt=span.short_excerpt[:500],
                    page_number=chunk.page_number,
                    section_title=chunk.section_title,
                    bounding_box_json=chunk.bounding_box_json,
                    evidence_directness=0.65,
                    evidence_independence=0.5,
                    reviewer_verified=False,
                )
            )
        created += 1
    await record_audit(
        session,
        event_type="ai_claim_extraction",
        entity_type="model_run",
        entity_id=run.id,
        actor_id=None,
        request_id=f"worker:{run.id}",
        after={"proposals_created": created, "status": "proposed"},
    )
    return {"status": "proposed", "claims_created": created, "model_run_id": str(run.id)}


async def extract_entities_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    source_id = _uuid(payload, "source_id")
    chunks, corpus = await _eligible_chunks(session, source_id)
    if not chunks:
        raise ValueError("No public-safe AI-eligible source chunks")
    prompt_template = load_prompt("entity_extraction.v1.txt")
    prompt = prompt_template.text + "\n" + corpus
    run = _model_run("entity_extraction", prompt, f"{len(chunks)} redacted chunks", get_settings().llm_model, prompt_template.version)
    session.add(run)
    await session.flush()
    try:
        output = await get_ai_provider().generate_structured(prompt, EntityExtractionOutput)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: structured output request or validation failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise
    output_json = output.model_dump(mode="json")
    if contains_blocked_content(json.dumps(output_json, ensure_ascii=False)):
        run.output_json = {"discarded": True, "reason": "controlled_output"}
        run.validation_status = "failed_policy_validation"
        run.completed_at = datetime.now(timezone.utc)
        return {"status": "validation_failed", "reason": "controlled_output"}
    run.output_json = output_json
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    valid_ids = {chunk.id for chunk in chunks}
    created = 0
    for suggestion in output.entities:
        supporting = [span for span in suggestion.supporting_spans if span.chunk_id in valid_ids]
        entity = Entity(
            project_id=project_id,
            entity_type=suggestion.entity_type,
            preferred_label_json={"en": suggestion.label},
            alternative_labels_json=suggestion.aliases,
            description=(
                f"AI-proposed entity suggestion; uncertainty={suggestion.uncertainty:.2f}; "
                f"validated_supporting_spans={len(supporting)}. {suggestion.notes}"
            ),
            external_identifier_json={},
            review_status="proposed",
        )
        session.add(entity)
        created += 1
    return {"status": "proposed", "entities_created": created, "model_run_id": str(run.id)}


async def propose_image_observations_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    asset_id = _uuid(payload, "asset_id")
    asset = await session.get(Asset, asset_id)
    if asset is None or not asset.mime_type.startswith("image/"):
        raise ValueError("Image asset does not exist")
    prompt_template = load_prompt("image_observation.v1.txt")
    prompt = prompt_template.text
    image = await get_storage().get(asset.storage_key)
    run = _model_run("image_observation", prompt, f"image asset {asset.id}; bytes omitted", get_settings().vision_model, prompt_template.version)
    run.input_hash = hashlib.sha256(image + prompt.encode()).hexdigest()
    session.add(run)
    await session.flush()
    try:
        output = await get_ai_provider().analyze_image(image, prompt, ImageObservationOutput)
    except Exception as exc:
        run.validation_status = "failed"
        run.error_message = f"{type(exc).__name__}: image output request or validation failed"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        raise
    output_json = output.model_dump(mode="json")
    if contains_blocked_content(json.dumps(output_json, ensure_ascii=False)):
        run.output_json = {"discarded": True, "reason": "controlled_output"}
        run.validation_status = "failed_policy_validation"
        run.completed_at = datetime.now(timezone.utc)
        return {"status": "validation_failed", "reason": "controlled_output"}
    run.output_json = output_json
    run.validation_status = "valid"
    run.completed_at = datetime.now(timezone.utc)
    for proposal in output.observations:
        if contains_blocked_content(proposal.description):
            continue
        session.add(
            ImageObservation(
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
        )
    created = sum(
        1
        for proposal in output.observations
        if not contains_blocked_content(proposal.description)
    )
    return {"status": "proposed", "observations_created": created, "model_run_id": str(run.id)}


async def source_family_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    sources = list(
        await session.scalars(select(SourceRecord).where(SourceRecord.project_id == project_id))
    )
    families: dict[str, list[str]] = {}
    for source in sources:
        key = source_family_key(
            SourceFingerprint(
                canonical_url=source.canonical_url or source.original_url,
                content_hash=source.content_sha256,
                normalized_title=source.title,
            )
        )
        families.setdefault(key, []).append(str(source.id))
    return {"status": "calculated", "families": families}


async def contradiction_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    claims = list(
        await session.scalars(
            select(Claim).where(
                Claim.project_id == project_id,
                Claim.epistemic_status.in_(["accepted", "disputed"]),
            )
        )
    )
    created = 0
    for first, second in combinations(claims, 2):
        if first.claim_type != second.claim_type:
            continue
        result = compare_claims(
            ClaimView(first.statement, first.claim_type, (str(first.id),)),
            ClaimView(second.statement, second.claim_type, (str(second.id),)),
        )
        if result.classification not in {"partially_conflicting", "directly_conflicting"}:
            continue
        existing = await session.scalar(
            select(Contradiction.id).where(
                Contradiction.project_id == project_id,
                Contradiction.claim_a_id == first.id,
                Contradiction.claim_b_id == second.id,
            )
        )
        if existing:
            continue
        session.add(
            Contradiction(
                project_id=project_id,
                claim_a_id=first.id,
                claim_b_id=second.id,
                contradiction_type=result.contradiction_type or "partial",
                explanation=result.reason,
                detected_by="rule",
                review_status="proposed",
            )
        )
        created += 1
    return {"status": "proposed", "contradictions_created": created}


async def recalculate_confidence_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    claims = list(await session.scalars(select(Claim).where(Claim.project_id == project_id)))
    updated = 0
    for claim in claims:
        links = list(
            await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id))
        )
        if not links:
            continue
        sources = [await session.get(SourceRecord, link.source_id) for link in links]
        real_sources = [source for source in sources if source]
        if not real_sources:
            continue
        score = calculate_claim_confidence(
            source_quality=sum(source.source_quality_score for source in real_sources) / len(real_sources),
            directness=sum(link.evidence_directness for link in links) / len(links),
            independence=sum(link.evidence_independence for link in links) / len(links),
            agreement=min(1.0, len({source.content_sha256 for source in real_sources}) / 2),
            temporal_proximity=0.5,
            source_tier="D" if all(source.source_tier == "D" for source in real_sources) else "C",
            high_quality_conflict=any(
                link.relation == "contradicts" and source and source.source_tier in {"A", "B"}
                for link, source in zip(links, sources, strict=True)
            ),
        )
        claim.confidence_score = score.score
        claim.confidence_label = score.label
        if score.disputed_queue:
            claim.epistemic_status = "disputed"
        updated += 1
    return {"status": "calculated", "claims_updated": updated}


async def timeline_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    count = await session.scalar(
        select(func.count())
        .select_from(Claim)
        .where(
            Claim.project_id == project_id,
            Claim.epistemic_status == "accepted",
            Claim.claim_type.in_(["chronology", "design_change", "production", "media_representation"]),
        )
    )
    return {"status": "calculated", "eligible_timeline_claims": int(count or 0)}


async def validate_publication_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    project_id = _uuid(payload, "project_id")
    blockers = await validate_project_publication(session, project_id)
    return {
        "status": "blocked" if blockers else "valid",
        "blocker_count": len(blockers),
        "blockers": [blocker.__dict__ for blocker in blockers],
    }


async def validate_brief_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    version_id = _uuid(payload, "version_id")
    version = await session.get(ReconstructionVersion, version_id)
    if version is None:
        raise ValueError("Reconstruction version does not exist")
    brief = ReconstructionBriefV1.model_validate(version.reconstruction_brief_json)
    report = SafeProxyBackend().create_validation_report(brief)
    return {"status": "valid" if report["public_safety_validation_result"]["valid"] else "blocked", "report": report}


async def ocr_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    del session, payload
    return {
        "status": "capability_unavailable",
        "reason": "No OCR engine is configured; the source remains marked OCR pending",
    }
