import re
from dataclasses import dataclass

BLOCK_PATTERNS = {
    "manufacturing": re.compile(r"\b(?:make|manufacture|machine|mill|grind|drill|cad|stl|g[- ]?code|tolerance|assemble|assembly|mechanism|moving parts?|joint)\b|怎么做|如何制造|加工|钻孔|研磨|公差|图纸|装配|活动结构|机械结构|关节", re.I),
    "measurement": re.compile(r"\b(?:exact dimensions?|measurements?|length|width|thickness|scale ratio)\b|精确尺寸|长度|宽度|厚度|比例推算", re.I),
    "operation": re.compile(r"\b(?:how to use|flip|flipping|trick|grip|animation steps?)\b|怎么用|使用方法|花式|动作分解|握法|教程", re.I),
    "purchasing": re.compile(r"\b(?:buy|purchase|for sale|seller|price|ship)\b|购买|哪里买|出售|卖家|价格", re.I),
    "evasion": re.compile(r"\b(?:conceal|hide|bypass|evade|carry|carrying)\b|隐藏|规避|绕过|携带", re.I),
}


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    category: str | None
    response: str | None
    suggested_topics: tuple[str, ...]


def evaluate_question(question: str, language: str = "en") -> PolicyDecision:
    for category, pattern in BLOCK_PATTERNS.items():
        if pattern.search(question):
            response = (
                "该问题超出本档案的研究范围。你可以询问历史、文化、设计、媒体研究、档案来源或证据方法。"
                if language == "zh"
                else "That question is outside this archive’s research scope. Ask about history, culture, design, media studies, archival sources, or evidence methods."
            )
            return PolicyDecision(False, category, response, ("history", "culture", "design", "media", "archives", "evidence"))
    return PolicyDecision(True, None, None, ())


def insufficient_evidence(language: str) -> str:
    return "现有资料不足以支持确定结论。" if language == "zh" else "The current evidence is insufficient to support a definite conclusion."
