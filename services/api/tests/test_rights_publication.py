from app.services.publication.validator import PublicationInput, validate_publication
from app.services.rights.rights_gate import evaluate_rights


def test_rights_gate_defaults_unknown_to_metadata_only() -> None:
    decision = evaluate_rights("unknown")
    assert not decision.may_display_original
    assert decision.metadata_only


def test_restricted_is_admin_only() -> None:
    decision = evaluate_rights("restricted")
    assert decision.administrator_only
    assert not decision.may_display_original


def test_license_requires_attribution() -> None:
    assert not evaluate_rights("licensed", "").may_display_original
    assert evaluate_rights("licensed", "Museum, license URI").may_display_original


def test_publication_validator_reports_actionable_blockers() -> None:
    blockers = validate_publication(PublicationInput(
        sources=[{"id": "s1", "rights_status": "unknown", "public_display_allowed": True, "attribution_text": ""}],
        assets=[{"id": "a1", "rights_status": "unknown", "public_display_allowed": True, "is_synthetic": True, "synthetic_label": ""}],
        claims=[{"id": "c1", "epistemic_status": "accepted", "evidence_count": 0, "statement": "Reviewable safe statement", "public": True}],
        features=[{"id": "f1", "epistemic_state": "inferred", "review_status": "proposed", "uncertainty_label": ""}],
        reconstructions=[{"id": "r1", "approved_for_public_display": False}],
    ))
    codes = {item.code for item in blockers}
    assert {"rights_gate", "missing_attribution", "asset_rights", "synthetic_unlabelled", "claim_without_evidence", "unreviewed_inference", "missing_uncertainty", "reconstruction_unapproved"} <= codes
    assert all(item.path.startswith("/admin/") for item in blockers)


def test_clean_fixture_can_publish() -> None:
    blockers = validate_publication(PublicationInput(
        sources=[{"id": "s1", "rights_status": "public_domain", "public_display_allowed": True, "attribution_text": "Archive"}],
        assets=[{"id": "a1", "rights_status": "public_domain", "public_display_allowed": True, "is_synthetic": False}],
        claims=[{"id": "c1", "epistemic_status": "accepted", "evidence_count": 1, "statement": "Saved source states a visual observation.", "public": True}],
        features=[{"id": "f1", "epistemic_state": "observed", "review_status": "accepted", "uncertainty_label": "observed"}],
        reconstructions=[{"id": "r1", "approved_for_public_display": True}],
    ))
    assert blockers == []
