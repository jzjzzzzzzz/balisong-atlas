from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    ArtifactRecord,
    Claim,
    DesignFeature,
    DesignFeatureEvidence,
    ImageObservation,
    ReconstructionHypothesis,
    ReconstructionVersion,
)
from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import (
    BilingualTitle,
    ExcludedInformation,
    HistoricalPeriod,
    ReconstructionBriefV1,
    SafetyConstraints,
    Uncertainty,
    VisualFeatureBrief,
)


async def generate_reconstruction_version(
    session: AsyncSession,
    hypothesis: ReconstructionHypothesis,
) -> tuple[ReconstructionVersion, dict[str, object]]:
    artifact = await session.get(ArtifactRecord, hypothesis.artifact_id)
    if artifact is None:
        raise ValueError("Artifact does not exist")
    features = list(
        await session.scalars(
            select(DesignFeature).where(
                DesignFeature.artifact_id == artifact.id,
                DesignFeature.review_status == "accepted",
                DesignFeature.public_safe.is_(True),
            )
        )
    )
    visual_features: list[VisualFeatureBrief] = []
    uncertainties: list[Uncertainty] = []
    source_claim_ids: set[UUID] = set()
    source_observation_ids: set[UUID] = set()
    for feature in features:
        links = list(
            await session.scalars(
                select(DesignFeatureEvidence).where(
                    DesignFeatureEvidence.design_feature_id == feature.id,
                    DesignFeatureEvidence.reviewer_verified.is_(True),
                )
            )
        )
        claim_ids: list[UUID] = []
        observation_ids: list[UUID] = []
        for link in links:
            if link.claim_id:
                claim = await session.get(Claim, link.claim_id)
                if claim and claim.epistemic_status == "accepted":
                    claim_ids.append(claim.id)
                    source_claim_ids.add(claim.id)
            if link.image_observation_id:
                observation = await session.get(ImageObservation, link.image_observation_id)
                if observation and observation.review_status == "accepted":
                    observation_ids.append(observation.id)
                    source_observation_ids.add(observation.id)
        if not claim_ids and not observation_ids:
            continue
        include = not feature.excluded_from_geometry and feature.epistemic_state != "unknown"
        visual_features.append(
            VisualFeatureBrief(
                feature_id=feature.id,
                category=feature.category,
                description=feature.description,
                epistemic_state=feature.epistemic_state,
                confidence=feature.confidence_score,
                evidence_claim_ids=claim_ids,
                evidence_observation_ids=observation_ids,
                include_in_public_proxy=include,
            )
        )
        if feature.epistemic_state != "observed":
            uncertainties.append(
                Uncertainty(
                    description=(
                        f"{feature.label} is marked {feature.epistemic_state} and is not "
                        "presented as directly observed."
                    ),
                    reason=(
                        "unsupported_inference"
                        if feature.epistemic_state == "inferred"
                        else "missing_view"
                    ),
                    related_feature_ids=[feature.id],
                )
            )
    if not visual_features:
        raise ValueError("No accepted, evidence-bound public-safe features are available")
    chronology = list(
        await session.scalars(
            select(Claim).where(
                Claim.artifact_id == artifact.id,
                Claim.claim_type == "chronology",
                Claim.epistemic_status == "accepted",
            )
        )
    )
    period_ids = [claim.id for claim in chronology]
    source_claim_ids.update(period_ids)
    brief = ReconstructionBriefV1(
        project_id=hypothesis.project_id,
        artifact_id=artifact.id,
        hypothesis_id=hypothesis.id,
        title=BilingualTitle(en=hypothesis.title, zh="重建假设：" + artifact.preferred_name),
        historical_period=HistoricalPeriod(
            label=chronology[0].statement if chronology else "Period not established",
            confidence=(
                sum(claim.confidence_score for claim in chronology) / len(chronology)
                if chronology
                else 0.0
            ),
            evidence_ids=period_ids,
        ),
        visual_features=visual_features,
        uncertainties=uncertainties
        or [
            Uncertainty(
                description=(
                    "The visual proxy remains interpretive even where visible features are supported."
                ),
                reason="missing_view",
                related_feature_ids=[],
            )
        ],
        excluded_information=[
            ExcludedInformation(category=category)
            for category in ("measurement", "mechanism", "manufacturing", "operation")
        ],
        safety_constraints=SafetyConstraints(),
    )
    latest = (
        await session.scalar(
            select(func.max(ReconstructionVersion.version_number)).where(
                ReconstructionVersion.hypothesis_id == hypothesis.id
            )
        )
        or 0
    )
    version = ReconstructionVersion(
        hypothesis_id=hypothesis.id,
        version_number=latest + 1,
        reconstruction_brief_json=brief.model_dump(mode="json"),
        brief_schema_version="1.0",
        renderer_version="safe-proxy-v1",
        source_claim_ids_json=[str(item) for item in sorted(source_claim_ids, key=str)],
        source_observation_ids_json=[
            str(item) for item in sorted(source_observation_ids, key=str)
        ],
        is_nonfunctional=True,
        real_scale_removed=True,
        parts_joined=True,
        no_moving_parts=True,
        approved_for_public_display=False,
    )
    session.add(version)
    hypothesis.status = "review"
    await session.flush()
    report = SafeProxyBackend().create_validation_report(brief)
    return version, report
