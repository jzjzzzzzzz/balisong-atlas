from typing import Any
from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import (
    ArtifactRecord,
    Claim,
    ClaimEvidence,
    Contradiction,
    DesignFeature,
    SourceRecord,
)
from app.services.evidence.claim_confidence_service import calculate_claim_confidence

router = APIRouter(tags=["evidence"])


@router.get("/projects/{project_id}/evidence-graph")
async def evidence_graph(project_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    artifacts = list(await session.scalars(select(ArtifactRecord).where(ArtifactRecord.project_id == project_id)))
    sources = list(await session.scalars(select(SourceRecord).where(SourceRecord.project_id == project_id)))
    claims = list(await session.scalars(select(Claim).where(Claim.project_id == project_id)))
    features = list(await session.scalars(select(DesignFeature).where(DesignFeature.project_id == project_id)))
    evidence = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id.in_([claim.id for claim in claims])))) if claims else []
    contradictions = list(await session.scalars(select(Contradiction).where(Contradiction.project_id == project_id)))
    nodes = (
        [{"id": str(item.id), "type": "artifact", "label": item.preferred_name, "status": item.record_status} for item in artifacts]
        + [{"id": str(item.id), "type": "source", "label": item.title, "status": item.source_tier} for item in sources]
        + [{"id": str(item.id), "type": "claim", "label": item.statement, "status": item.epistemic_status} for item in claims]
        + [{"id": str(item.id), "type": "visual_feature", "label": item.label, "status": item.review_status} for item in features]
    )
    edges = [
        {"id": str(item.id), "source": str(item.source_id), "target": str(item.claim_id), "relation": item.relation, "verified": item.reviewer_verified}
        for item in evidence
    ] + [
        {"id": str(item.id), "source": str(item.claim_a_id), "target": str(item.claim_b_id), "relation": "contradicts", "verified": item.review_status == "accepted"}
        for item in contradictions
    ] + [
        {"id": f"artifact-claim-{claim.id}", "source": str(claim.artifact_id), "target": str(claim.id), "relation": "associated_with", "verified": claim.epistemic_status == "accepted"}
        for claim in claims if claim.artifact_id
    ]
    return {"nodes": nodes, "edges": edges, "legend": ["supports", "contradicts", "depicts", "associated_with", "attributed_to", "located_in", "derived_from", "used_in_reconstruction"]}


@router.get("/projects/{project_id}/contradictions")
async def contradictions(project_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(Contradiction).where(Contradiction.project_id == project_id)))
    return [row_dict(item) for item in rows]


@router.post("/projects/{project_id}/recalculate-confidence")
async def recalculate_confidence(project_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, int]:
    del user
    claims = list(await session.scalars(select(Claim).where(Claim.project_id == project_id)))
    updated = 0
    for claim in claims:
        links = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id)))
        if not links:
            continue
        sources = [await session.get(SourceRecord, link.source_id) for link in links]
        quality = sum(source.source_quality_score for source in sources if source) / max(1, len([source for source in sources if source]))
        directness = sum(link.evidence_directness for link in links) / len(links)
        independence = sum(link.evidence_independence for link in links) / len(links)
        tiers = [source.source_tier for source in sources if source]
        result = calculate_claim_confidence(
            source_quality=quality, directness=directness, independence=independence,
            agreement=min(1.0, len({source.content_sha256 for source in sources if source}) / 2),
            temporal_proximity=0.5, source_tier="D" if tiers and all(tier == "D" for tier in tiers) else "C",
            high_quality_conflict=any(link.relation == "contradicts" and source and source.source_tier in {"A", "B"} for link, source in zip(links, sources, strict=True)),
        )
        claim.confidence_score = result.score
        claim.confidence_label = result.label
        if result.disputed_queue:
            claim.epistemic_status = "disputed"
        updated += 1
    await session.commit()
    return {"updated": updated}
