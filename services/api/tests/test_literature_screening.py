import json
from pathlib import Path

import pymupdf
from scripts.screen_literature import classify, scan_pdf


def test_classify_prioritizes_direct_and_cooccurring_leads() -> None:
    empty = {
        "direct_subject": [],
        "regional_context": [],
        "material_culture": [],
        "craft_history": [],
    }
    band, score = classify({**empty, "direct_subject": [2]}, [])
    assert band == "direct_term_lead"
    assert score == 40

    band, score = classify(
        {**empty, "regional_context": [1], "material_culture": [1]}, [1]
    )
    assert band == "regional_material_context"
    assert score == 26


def test_pdf_screen_stores_locations_but_not_source_text(tmp_path: Path) -> None:
    path = tmp_path / "fixture.pdf"
    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((72, 72), "Batangas cultural record discussed a museum knife.")
    document.save(path)
    document.close()

    result = scan_pdf(path)

    assert result["relevance_band"] == "regional_material_context"
    assert result["regional_material_cooccurrence_pages"] == [1]
    assert result["matched_groups"]["regional_context"]["page_numbers"] == [1]
    assert "text" not in result
    assert "excerpt" not in result


def test_certainty_audit_keeps_records_traceable_and_claims_proposed() -> None:
    root = Path(__file__).parents[3]
    audit = json.loads((root / "data/research/certainty-audit.json").read_text())
    bibliography = json.loads((root / "data/research/bibliography.json").read_text())
    source_ids = {record["id"] for record in bibliography["records"]}
    records = audit["records"]

    assert audit["policy"]["claim_lifecycle_status"] == "proposed"
    assert audit["summary"] == {
        "verified_records": 7,
        "corroborated_leads": 2,
        "unresolved_questions": 3,
    }
    assert len(records) == sum(audit["summary"].values())
    assert {record["status"] for record in records} == {
        "verified_record",
        "corroborated_lead",
        "unresolved",
    }

    for record in records:
        assert record["evidence"]
        assert record["supports"]["en"] and record["supports"]["zh"]
        assert record["limit"]["en"] and record["limit"]["zh"]
        assert record["public_safe"] is True
        assert all(evidence["source_id"] in source_ids for evidence in record["evidence"])
