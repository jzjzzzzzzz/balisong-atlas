from app.services.evidence.evidence_score import (
    EvidenceScore,
    EvidenceScoreInput,
    calculate_evidence_score,
)


def calculate_claim_confidence(
    *,
    source_quality: float,
    directness: float,
    independence: float,
    agreement: float,
    temporal_proximity: float,
    source_tier: str,
    high_quality_conflict: bool,
) -> EvidenceScore:
    return calculate_evidence_score(
        EvidenceScoreInput(
            source_quality=source_quality,
            evidence_directness=directness,
            source_independence=independence,
            cross_source_agreement=agreement,
            temporal_proximity=temporal_proximity,
            source_tier=source_tier,
            high_quality_conflict=high_quality_conflict,
        )
    )
