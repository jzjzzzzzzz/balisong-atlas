import re
from dataclasses import dataclass

MEASUREMENT_RE = re.compile(
    r"(?<![\w.])\d+(?:[.,]\d+)?\s*(?:mm|cm|millimet(?:er|re)s?|centimet(?:er|re)s?|"
    r"in(?:ch(?:es)?)?|英寸|毫米|厘米)(?!\w)",
    re.IGNORECASE,
)
MANUFACTURING_RE = re.compile(
    r"\b(?:machine|machining|mill|milling|drill|grind|grinding|heat[- ]?treat|tolerance|"
    r"g[- ]?code|cad|stl|step|dxf|assemble|assembly)\b|加工|制造步骤|钻孔|研磨|热处理|公差|装配",
    re.IGNORECASE,
)
OPERATIONAL_RE = re.compile(
    r"\b(?:how to use|operating steps?|flipping guide|trick tutorial|grip angle|carry concealed|"
    r"hide from|bypass rules?)\b|使用步骤|操作方法|花式教程|动作分解|握持|隐藏携带|规避规则",
    re.IGNORECASE,
)
PURCHASING_RE = re.compile(
    r"\b(?:buy now|where to buy|for sale|price|shipping|checkout)\b|购买链接|哪里买|出售|售价|下单",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Detection:
    category: str
    confidence: float
    action: str


def detect_sensitive_content(text: str) -> list[Detection]:
    detections: list[Detection] = []
    if MEASUREMENT_RE.search(text):
        detections.append(Detection("exact_measurement", 0.99, "redact"))
    if MANUFACTURING_RE.search(text):
        detections.append(Detection("manufacturing_instruction", 0.95, "exclude_from_ai"))
    if OPERATIONAL_RE.search(text):
        detections.append(Detection("operational_instruction", 0.95, "exclude_from_ai"))
    if PURCHASING_RE.search(text):
        detections.append(Detection("purchasing_information", 0.95, "exclude_from_search"))
    return detections


def contains_blocked_content(text: str) -> bool:
    return bool(detect_sensitive_content(text))


def redact_controlled_text(text: str) -> str:
    redacted = MEASUREMENT_RE.sub("[REDACTED: exact measurement]", text)
    redacted = MANUFACTURING_RE.sub("[REDACTED: controlled instruction]", redacted)
    redacted = OPERATIONAL_RE.sub("[REDACTED: operational content]", redacted)
    redacted = PURCHASING_RE.sub("[REDACTED: acquisition information]", redacted)
    return redacted


def redact_public_text(text: str, max_excerpt_chars: int = 1000) -> str:
    redacted = redact_controlled_text(text)
    if len(redacted) > max_excerpt_chars:
        redacted = redacted[:max_excerpt_chars].rstrip() + "… [excerpt shortened]"
    return redacted
