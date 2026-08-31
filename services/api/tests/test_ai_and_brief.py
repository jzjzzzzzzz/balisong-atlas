from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.ai.providers.mock import MockAIProvider
from app.ai.schemas.tasks import ClaimProposalOutput
from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import ReconstructionBriefV1


def valid_brief() -> dict[str, object]:
    feature_id, evidence_id = uuid4(), uuid4()
    return {
        "schema_version": "1.0",
        "project_id": str(uuid4()),
        "artifact_id": str(uuid4()),
        "hypothesis_id": str(uuid4()),
        "title": {"en": "Abstract visual hypothesis", "zh": "抽象视觉假设"},
        "historical_period": {"label": "Unknown period", "confidence": 0.2, "evidence_ids": [str(evidence_id)]},
        "visual_features": [{
            "feature_id": str(feature_id), "category": "silhouette", "description": "A rounded abstract contour.",
            "epistemic_state": "observed", "confidence": 0.8,
            "evidence_claim_ids": [str(evidence_id)], "evidence_observation_ids": [],
            "include_in_public_proxy": True,
        }],
        "uncertainties": [{"description": "Other views are missing.", "reason": "missing_view", "related_feature_ids": [str(feature_id)]}],
        "excluded_information": [
            {"category": category, "reason": "Excluded by research and safety policy"}
            for category in ("measurement", "mechanism", "manufacturing", "operation")
        ],
        "safety_constraints": {
            "nonfunctional": True, "real_scale_removed": True, "joined_mesh_only": True,
            "no_internal_mechanism": True, "no_moving_parts": True, "no_manufacturing_exports": True,
            "neutral_central_insert": True, "no_sharpened_edge": True,
        },
    }


def test_reconstruction_brief_schema_and_safe_backend() -> None:
    brief = ReconstructionBriefV1.model_validate(valid_brief())
    result = SafeProxyBackend().validate_brief(brief)
    assert result["valid"]
    report = SafeProxyBackend().create_validation_report(brief)
    assert report["joined_mesh_confirmation"] is True
    assert report["real_scale_removed_confirmation"] is True
    assert report["no_moving_parts_confirmation"] is True
    assert report["neutral_insert_confirmation"] is True


def test_unknown_feature_cannot_be_completed() -> None:
    payload = valid_brief()
    payload["visual_features"][0]["epistemic_state"] = "unknown"  # type: ignore[index]
    with pytest.raises(ValidationError, match="Unknown features"):
        ReconstructionBriefV1.model_validate(payload)


def test_feature_without_evidence_is_rejected() -> None:
    payload = valid_brief()
    payload["visual_features"][0]["evidence_claim_ids"] = []  # type: ignore[index]
    with pytest.raises(ValidationError, match="evidence ID"):
        ReconstructionBriefV1.model_validate(payload)


def test_public_visual_field_with_forbidden_mechanical_term_is_blocked() -> None:
    payload = valid_brief()
    payload["visual_features"][0]["description"] = "A precise pivot mechanism."  # type: ignore[index]
    brief = ReconstructionBriefV1.model_validate(payload)
    result = SafeProxyBackend().validate_brief(brief)
    assert not result["valid"]
    assert "pivot" in result["violations"]


def test_missing_blender_is_honest(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.reconstruction.backend.shutil.which", lambda _: None)
    capability = SafeProxyBackend().capability()
    assert capability == {"available": False, "executable": None, "fixture_available": True}


@pytest.mark.asyncio
async def test_mock_ai_is_deterministic_and_evidence_bound() -> None:
    chunk_id = uuid4()
    prompt = f"chunk_id={chunk_id}\n<untrusted_source>Saved archive text supports a bounded claim.</untrusted_source>"
    provider = MockAIProvider()
    first = await provider.generate_structured(prompt, ClaimProposalOutput)
    second = await provider.generate_structured(prompt, ClaimProposalOutput)
    assert first == second
    assert first.claims[0].requires_human_review is True
    assert first.claims[0].evidence_spans[0].chunk_id == chunk_id
    assert first.claims[0].evidence_spans
