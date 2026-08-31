from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    Asset,
    Claim,
    ClaimEvidence,
    DesignFeature,
    ReconstructionHypothesis,
    ReconstructionVersion,
    SourceChunk,
    SourceRecord,
)
from app.services.publication.validator import (
    PublicationBlocker,
    PublicationInput,
    validate_publication,
)


async def validate_project_publication(session: AsyncSession, project_id: UUID) -> list[PublicationBlocker]:
    sources = list(await session.scalars(select(SourceRecord).where(SourceRecord.project_id == project_id)))
    assets = list(await session.scalars(select(Asset).where(Asset.project_id == project_id)))
    claims = list(await session.scalars(select(Claim).where(Claim.project_id == project_id)))
    features = list(await session.scalars(select(DesignFeature).where(DesignFeature.project_id == project_id)))
    evidence_counts = {
        claim_id: count
        for claim_id, count in (await session.execute(select(ClaimEvidence.claim_id, func.count()).where(ClaimEvidence.reviewer_verified.is_(True)).group_by(ClaimEvidence.claim_id))).all()
    }
    evidence_rows = list(
        await session.scalars(
            select(ClaimEvidence).where(ClaimEvidence.claim_id.in_([claim.id for claim in claims]))
        )
    ) if claims else []
    excerpts_by_claim: dict[UUID, str] = {}
    for evidence in evidence_rows:
        current = excerpts_by_claim.get(evidence.claim_id, "")
        if len(evidence.short_excerpt) > len(current):
            excerpts_by_claim[evidence.claim_id] = evidence.short_excerpt
    chunks = list(
        await session.scalars(
            select(SourceChunk).where(SourceChunk.source_id.in_([source.id for source in sources]))
        )
    ) if sources else []
    hypothesis_ids = [
        row[0]
        for row in (
            await session.execute(
                select(ReconstructionVersion.hypothesis_id)
                .join(
                    ReconstructionHypothesis,
                    ReconstructionVersion.hypothesis_id == ReconstructionHypothesis.id,
                )
                .where(ReconstructionHypothesis.project_id == project_id)
            )
        ).all()
    ]
    versions = list(await session.scalars(select(ReconstructionVersion).where(ReconstructionVersion.hypothesis_id.in_(hypothesis_ids)))) if hypothesis_ids else []
    return validate_publication(
        PublicationInput(
            sources=[{
                "id": source.id, "rights_status": source.rights_status,
                "attribution_text": source.attribution_text,
                "public_display_allowed": source.public_display_allowed,
            } for source in sources],
            assets=[{
                "id": asset.id, "rights_status": asset.rights_status,
                "public_display_allowed": asset.public_display_allowed,
                "is_synthetic": asset.is_synthetic, "synthetic_label": asset.synthetic_label,
            } for asset in assets],
            claims=[{
                "id": claim.id, "epistemic_status": claim.epistemic_status,
                "statement": claim.statement, "evidence_count": evidence_counts.get(claim.id, 0),
                "short_excerpt": excerpts_by_claim.get(claim.id, ""),
                "public": claim.epistemic_status != "rejected",
            } for claim in claims],
            features=[{
                "id": feature.id, "epistemic_state": feature.epistemic_state,
                "review_status": feature.review_status,
                "uncertainty_label": feature.epistemic_state if feature.epistemic_state != "observed" else "observed",
            } for feature in features],
            reconstructions=[{
                "id": version.id,
                "approved_for_public_display": version.approved_for_public_display,
            } for version in versions],
            chunks=[{
                "id": chunk.id,
                "public_safe_text": chunk.public_safe_text,
                "excluded_from_public_search": chunk.excluded_from_public_search,
            } for chunk in chunks],
        )
    )
