from pathlib import Path

from app.services.parsing.html_parser import parse_html
from app.services.parsing.image_processor import hamming_distance, image_metadata, perceptual_hash
from app.services.parsing.pdf_parser import parse_pdf

ROOT = Path(__file__).parents[3]


def test_pdf_parser_keeps_page_and_bbox() -> None:
    parsed = parse_pdf((ROOT / "data/fixtures/fictional-research-sheet.pdf").read_bytes())
    assert parsed.blocks
    assert parsed.blocks[0].page_number == 1
    assert set(parsed.blocks[0].bbox) == {"x0", "y0", "x1", "y1"}
    assert parsed.ocr_pages == []


def test_html_parser_removes_navigation_and_scripts() -> None:
    parsed = parse_html(b"<html><head><title>Saved page</title><meta name='author' content='Archive'></head><body><nav>Ignore nav</nav><main><h1>Record</h1><p>Evidence text.</p><script>bad()</script></main></body></html>")
    assert parsed.title == "Saved page"
    assert parsed.author == "Archive"
    assert "Evidence text" in parsed.text
    assert "Ignore nav" not in parsed.text
    assert "bad()" not in parsed.text


def test_image_metadata_and_duplicate_hash() -> None:
    content = (ROOT / "data/fixtures/abstract-study-a.png").read_bytes()
    assert image_metadata(content)[:2] == (720, 480)
    first = perceptual_hash(content)
    second = perceptual_hash(content)
    assert first == second
    assert hamming_distance(first, second) == 0
