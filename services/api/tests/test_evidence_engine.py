from app.services.evidence.contradiction_detector import ClaimView, compare_claims
from app.services.evidence.evidence_score import EvidenceScoreInput, calculate_evidence_score
from app.services.evidence.source_family_detector import (
    SourceFingerprint,
    group_source_families,
    source_family_key,
)


def test_weighted_score_and_breakdown() -> None:
    result = calculate_evidence_score(EvidenceScoreInput(0.9, 0.8, 0.7, 0.6, 0.5, "A"))
    assert result.score == 0.75
    assert result.label == "high"
    assert set(result.breakdown) == {"source_quality", "evidence_directness", "source_independence", "cross_source_agreement", "temporal_proximity"}


def test_tier_d_cannot_be_high_confidence() -> None:
    result = calculate_evidence_score(EvidenceScoreInput(1, 1, 1, 1, 1, "D"))
    assert result.score == 1
    assert result.label == "medium"


def test_score_rejects_out_of_bounds_factors() -> None:
    try:
        calculate_evidence_score(EvidenceScoreInput(1.1, 1, 1, 1, 1, "A"))
    except ValueError as exc:
        assert "between 0 and 1" in str(exc)
    else:
        raise AssertionError("Invalid factor should fail")


def test_high_quality_conflict_enters_disputed_queue() -> None:
    result = calculate_evidence_score(EvidenceScoreInput(0.9, 0.9, 0.9, 0.1, 0.5, "A", True))
    assert result.disputed_queue is True


def test_reposts_group_as_one_source_family() -> None:
    rows = [
        SourceFingerprint("https://example.org/story?utm_source=x", "abc", "A story"),
        SourceFingerprint("https://mirror.example/story", "abc", "Reposted story"),
        SourceFingerprint("https://other.example/item", "def", "Independent item"),
    ]
    groups = group_source_families(rows)
    assert sorted(len(group) for group in groups.values()) == [1, 2]
    assert source_family_key(rows[0]) == source_family_key(rows[1])


def test_explicit_year_conflict_requires_expert_review() -> None:
    result = compare_claims(
        ClaimView("The fictional caption dates the study to 1901.", "chronology", ("e1",), "family-a"),
        ClaimView("The fictional caption dates the study to 1912.", "chronology", ("e2",), "family-b"),
    )
    assert result.classification == "directly_conflicting"
    assert result.contradiction_type == "chronological"
    assert result.needs_expert_review


def test_different_claim_types_are_unrelated() -> None:
    result = compare_claims(ClaimView("A", "origin", ()), ClaimView("B", "terminology", ()))
    assert result.classification == "unrelated"
