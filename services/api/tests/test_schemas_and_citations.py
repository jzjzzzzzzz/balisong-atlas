from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.ai.schemas.tasks import ClaimProposalOutput
from app.schemas.domain import ArtifactCreate, EvidenceCreate


def test_ai_claim_requires_evidence_span() -> None:
    with pytest.raises(ValidationError):
        ClaimProposalOutput.model_validate({"claims": [{
            "statement": "A claim", "claim_type": "origin", "certainty": 0.5,
            "evidence_spans": [], "requires_human_review": True, "notes": "",
        }]})


def test_citation_requires_concrete_locator() -> None:
    with pytest.raises(ValidationError, match="chunk, asset, or image observation"):
        EvidenceCreate(
            source_id=uuid4(), relation="supports", short_excerpt="Short",
            evidence_directness=0.8, evidence_independence=0.8,
        )


def test_artifact_schema_rejects_exact_dimension_fields() -> None:
    with pytest.raises(ValidationError):
        ArtifactCreate.model_validate({
            "slug": "a-01", "preferred_name": "Fixture", "record_type": "reconstruction_subject",
            "exact_length": 12,
        })
