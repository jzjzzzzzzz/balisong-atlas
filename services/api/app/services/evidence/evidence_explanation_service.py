from app.services.evidence.evidence_score import EvidenceScore

LABELS = {
    "source_quality": ("Source quality", "来源质量"),
    "evidence_directness": ("Evidence directness", "证据直接性"),
    "source_independence": ("Source independence", "来源独立性"),
    "cross_source_agreement": ("Cross-source agreement", "跨来源一致性"),
    "temporal_proximity": ("Temporal proximity", "时间接近度"),
}


def explain_score(score: EvidenceScore, language: str = "en") -> dict[str, object]:
    index = 1 if language == "zh" else 0
    return {
        "score": score.score,
        "label": score.label,
        "disputed_queue": score.disputed_queue,
        "factors": [
            {"key": key, "label": LABELS[key][index], "value": value}
            for key, value in score.breakdown.items()
        ],
        "notice": (
            "分数仅用于排序与提示，不替代人工判断。"
            if language == "zh"
            else "The score supports ranking and review; it does not replace human judgment."
        ),
    }
