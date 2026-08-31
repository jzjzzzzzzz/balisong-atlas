from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class VersionedPrompt:
    version: str
    text: str


PROMPT_ROOT = Path(__file__).parent


def load_prompt(filename: str) -> VersionedPrompt:
    path = PROMPT_ROOT / filename
    if path.parent != PROMPT_ROOT or not path.name.endswith(".txt"):
        raise ValueError("Prompt filename is invalid")
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or not lines[0].startswith("PROMPT_VERSION="):
        raise ValueError(f"Prompt is missing its version header: {filename}")
    return VersionedPrompt(lines[0].split("=", 1)[1], "\n".join(lines[1:]).strip())
