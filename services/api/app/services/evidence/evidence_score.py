from dataclasses import dataclass


@dataclass(frozen=True)
class EvidenceScoreInput:
    source_quality: float
    evidence_directness: float
    source_independence: float
    cross_source_agreement: float
    temporal_proximity: float
    source_tier: str
    high_quality_conflict: bool = False


@dataclass(frozen=True)
class EvidenceScore:
    score: float
    label: str
    breakdown: dict[str, float]
    disputed_queue: bool


def _unit(value: float) -> float:
    if not 0 <= value <= 1:
        raise ValueError("Evidence score factors must be between 0 and 1")
    return value


def calculate_evidence_score(data: EvidenceScoreInput) -> EvidenceScore:
    factors = {
        "source_quality": _unit(data.source_quality),
        "evidence_directness": _unit(data.evidence_directness),
        "source_independence": _unit(data.source_independence),
        "cross_source_agreement": _unit(data.cross_source_agreement),
        "temporal_proximity": _unit(data.temporal_proximity),
    }
    score = round(
        0.30 * factors["source_quality"]
        + 0.25 * factors["evidence_directness"]
        + 0.20 * factors["source_independence"]
        + 0.15 * factors["cross_source_agreement"]
        + 0.10 * factors["temporal_proximity"],
        4,
    )
    label = "high" if score >= 0.75 else "medium" if score >= 0.45 else "low"
    if data.source_tier == "D" and label == "high":
        label = "medium"
    return EvidenceScore(score, label, factors, data.high_quality_conflict)
