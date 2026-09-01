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
