import re

INJECTION_PATTERNS = [
    re.compile(r"ignore (?:all |the )?(?:previous|system) instructions", re.I),
    re.compile(r"reveal (?:the )?(?:system prompt|api key|secret)", re.I),
    re.compile(r"(?:override|replace) (?:the )?(?:policy|instructions)", re.I),
    re.compile(r"忽略(?:之前|系统)(?:的)?指令"),
    re.compile(r"泄露(?:系统提示|密钥|密码)"),
]


def isolate_untrusted_source(text: str) -> tuple[str, bool]:
    detected = any(pattern.search(text) for pattern in INJECTION_PATTERNS)
    cleaned = text
    for pattern in INJECTION_PATTERNS:
        cleaned = pattern.sub("[UNTRUSTED INSTRUCTION REMOVED]", cleaned)
    return f"<untrusted_source>\n{cleaned}\n</untrusted_source>", detected
