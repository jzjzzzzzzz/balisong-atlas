import hashlib
import re
from uuid import NAMESPACE_URL, UUID, uuid5

from app.ai.providers.base import AIProvider, SchemaT
from app.ai.schemas.tasks import ClaimProposalOutput, EntityExtractionOutput, ImageObservationOutput
from app.core.config import get_settings
from app.services.ingestion.sensitive import redact_public_text

CHUNK_ID_RE = re.compile(r"chunk_id=([0-9a-fA-F-]{36})")


class MockAIProvider(AIProvider):
    async def generate_structured(self, prompt: str, schema: type[SchemaT]) -> SchemaT:
        safe = redact_public_text(prompt, max_excerpt_chars=700)
        match = CHUNK_ID_RE.search(prompt)
        chunk_id = UUID(match.group(1)) if match else uuid5(NAMESPACE_URL, "balisong-atlas-mock-chunk")
        corpus = safe.split("<untrusted_source>")[-1].split("</untrusted_source>")[0].strip()
        sentence = next((part.strip() for part in re.split(r"(?<=[.!?。！？])\s*", corpus) if len(part.strip()) >= 16), "The saved source contains a reviewable archival statement.")
        excerpt = sentence[:240]
        if schema is ClaimProposalOutput:
            payload = {
                "claims": [{
                    "statement": excerpt,
                    "claim_type": "cultural_significance",
                    "certainty": 0.52,
                    "evidence_spans": [{"chunk_id": str(chunk_id), "start_offset": 0, "end_offset": max(1, len(excerpt)), "short_excerpt": excerpt}],
                    "requires_human_review": True,
                    "notes": "Deterministic mock proposal; proposed status only."
                }]
            }
        elif schema is EntityExtractionOutput:
            payload = {"entities": []}
        else:
            payload = {}
        return schema.model_validate(payload)

    async def analyze_image(self, image: bytes, prompt: str, schema: type[SchemaT]) -> SchemaT:
        del prompt
        digest = hashlib.sha256(image).hexdigest()
        if schema is ImageObservationOutput:
            payload = {"observations": [{
                "observation_type": "color_appearance",
                "description": f"The image presents a muted two-tone surface appearance (fixture {digest[:8]}).",
                "epistemic_state": "observed",
                "confidence": 0.61,
                "normalized_bbox": {"x": 0.05, "y": 0.05, "width": 0.9, "height": 0.9},
                "requires_human_review": True
            }]}
        else:
            payload = {}
        return schema.model_validate(payload)

    async def embed_text(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        dimension = get_settings().embedding_dim
        for text in texts:
            digest = hashlib.sha256(text.encode()).digest()
            vectors.append(
                [
                    round((digest[index % len(digest)] - 127.5) / 127.5, 6)
                    for index in range(dimension)
                ]
            )
        return vectors

    async def health_check(self) -> dict[str, object]:
        return {"available": True, "mode": "mock", "deterministic": True, "external_calls": False}
