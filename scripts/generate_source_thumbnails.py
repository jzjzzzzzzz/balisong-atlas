#!/usr/bin/env python3
"""Render public-domain source title pages for the public reading room.

The command reads only locally collected, content-addressed PDFs.  Its output is
bibliographic navigation imagery, not object evidence: no interior technical
plate, measurement, or process page is rendered.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import fitz
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
REPORT_PATH = ROOT / "data" / "research" / "download-report.json"
OUTPUT_ROOT = ROOT / "apps" / "web" / "public" / "research"


@dataclass(frozen=True)
class ThumbnailSpec:
    source_id: str
    page_index: int
    output_name: str
    fit: str = "contain"


SPECS = (
    ThumbnailSpec("ia-filipinaspequeo01sastgoog", 7, "sastron-batangas-1895.webp"),
    ThumbnailSpec("ia-officialcatalogu00loui_2", 4, "philippine-exhibits-1904.webp", "cover"),
    ThumbnailSpec("krieger-1926-usnm-bulletin-137", 6, "usnm-bulletin-137-1926.webp"),
)


def resolve_research_copy(source_id: str) -> Path:
    report = json.loads(REPORT_PATH.read_text())
    for row in report["download_results"]:
        if row["source_id"] == source_id and row.get("storage_key"):
            path = ROOT / row["storage_key"]
            if path.is_file():
                return path
    raise FileNotFoundError(f"No local research copy recorded for {source_id}")


def render_title_page(spec: ThumbnailSpec) -> Image.Image:
    document = fitz.open(resolve_research_copy(spec.source_id))
    try:
        page = document[spec.page_index]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    finally:
        document.close()

    image = ImageEnhance.Contrast(image).enhance(1.035)
    canvas_size = (640, 860)
    if spec.fit == "cover":
        fitted = ImageOps.fit(image, canvas_size, method=Image.Resampling.LANCZOS)
    else:
        fitted = ImageOps.contain(image, (574, 794), method=Image.Resampling.LANCZOS)
        background = Image.new("RGB", canvas_size, "#e7decc")
        background.paste(fitted, ((canvas_size[0] - fitted.width) // 2, 33))
        fitted = background
    return fitted


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for spec in SPECS:
        output = OUTPUT_ROOT / spec.output_name
        render_title_page(spec).save(output, "WEBP", quality=86, method=6)
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
