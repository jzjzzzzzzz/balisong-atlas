import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ClaimView:
    statement: str
    claim_type: str
    evidence_ids: tuple[str, ...]
    source_family: str = ""


@dataclass(frozen=True)
class ContradictionResult:
    classification: str
    contradiction_type: str | None
    reason: str
    shared_source_family: bool
    needs_expert_review: bool


def _years(text: str) -> set[str]:
    return set(re.findall(r"\b(?:1[5-9]|20)\d{2}\b", text))


def compare_claims(first: ClaimView, second: ClaimView) -> ContradictionResult:
    same_family = bool(first.source_family and first.source_family == second.source_family)
    if first.claim_type != second.claim_type:
        return ContradictionResult("unrelated", None, "Claims address different categories.", same_family, False)
    years_a, years_b = _years(first.statement), _years(second.statement)
    if years_a and years_b and years_a.isdisjoint(years_b):
        return ContradictionResult(
            "directly_conflicting",
            "chronological",
            "The claims give non-overlapping explicit years; an expert must assess their cited contexts.",
            same_family,
            True,
        )
    negatives = ("not ", "no evidence", "did not", "并非", "没有证据", "不是")
    a_negative = any(token in first.statement.lower() for token in negatives)
    b_negative = any(token in second.statement.lower() for token in negatives)
    if a_negative != b_negative:
        return ContradictionResult(
            "partially_conflicting",
            "partial",
            "One statement negates a proposition that the other presents positively.",
            same_family,
            True,
        )
    if first.statement.strip().casefold() == second.statement.strip().casefold():
        return ContradictionResult("compatible", None, "Statements are equivalent.", same_family, False)
    return ContradictionResult(
        "partially_conflicting",
        "terminology",
        "The claims share a category but differ in wording; manual comparison is required.",
        same_family,
        True,
    )
