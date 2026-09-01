#!/usr/bin/env python3
"""Create a page-level, metadata-only relevance screen for private PDFs.

The scanner deliberately records only aggregate term counts and page numbers.
It never persists page text, excerpts, measurements, or instructions, and its
output is a discovery aid rather than evidence or an AI-generated conclusion.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "research" / "bibliography.json"
REPORT_PATH = ROOT / "data" / "research" / "download-report.json"
OUTPUT_PATH = ROOT / "data" / "research" / "screening.json"

TERM_GROUPS: dict[str, tuple[re.Pattern[str], ...]] = {
    "direct_subject": (
        re.compile(r"\bbalisong\b", re.IGNORECASE),
        re.compile(r"\bbutterfly[ -]knife\b", re.IGNORECASE),
    ),
    "regional_context": (
        re.compile(r"\bbatangas\b", re.IGNORECASE),
        re.compile(r"\btaal\b", re.IGNORECASE),
    ),
    "material_culture": (
        re.compile(r"\b(?:knife|knives)\b", re.IGNORECASE),
        re.compile(r"\bcutlery\b", re.IGNORECASE),
        re.compile(r"\bmetal[ -]?craft\b", re.IGNORECASE),
        re.compile(r"\bblacksmiths?\b", re.IGNORECASE),
        re.compile(r"\bsmithy\b", re.IGNORECASE),
        re.compile(r"\barms and armor\b", re.IGNORECASE),
        re.compile(r"\bcuchillos?\b", re.IGNORECASE),
        re.compile(r"\bherreros?\b", re.IGNORECASE),
    ),
    "craft_history": (
        re.compile(r"\bcrafts?\b", re.IGNORECASE),
        re.compile(r"\bhandicrafts?\b", re.IGNORECASE),
        re.compile(r"\bindustr(?:y|ies|ial)\b", re.IGNORECASE),
        re.compile(r"\bexhibitions?\b", re.IGNORECASE),
        re.compile(r"\bexpositions?\b", re.IGNORECASE),
    ),
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def classify(matches: dict[str, list[int]], cooccurrence_pages: list[int]) -> tuple[str, int]:
    direct = len(matches["direct_subject"])
    regional = len(matches["regional_context"])
    material = len(matches["material_culture"])
    craft = len(matches["craft_history"])
    score = min(direct, 2) * 40
    score += min(len(cooccurrence_pages), 2) * 15
    score += min(regional, 4) * 8
    score += min(material, 6) * 3
    score += min(craft, 6)
    if direct:
        return "direct_term_lead", min(score, 100)
    if cooccurrence_pages:
        return "regional_material_context", min(score, 100)
    if regional:
        return "regional_context", min(score, 100)
    if material >= 3:
        return "material_culture_context", min(score, 100)
    return "background_only", min(score, 100)


def scan_pdf(path: Path) -> dict[str, Any]:
    pages_by_group: dict[str, list[int]] = defaultdict(list)
    cooccurrence_pages: list[int] = []
    searchable_pages = 0
    with pymupdf.open(path) as document:
        for page_index, page in enumerate(document):
            text = page.get_text("text")
            if text.strip():
                searchable_pages += 1
            matched_on_page: set[str] = set()
            for group, patterns in TERM_GROUPS.items():
                if any(pattern.search(text) for pattern in patterns):
                    pages_by_group[group].append(page_index + 1)
                    matched_on_page.add(group)
            if {"regional_context", "material_culture"}.issubset(matched_on_page):
                cooccurrence_pages.append(page_index + 1)
        page_count = len(document)

    normalized = {group: pages_by_group[group] for group in TERM_GROUPS}
    band, score = classify(normalized, cooccurrence_pages)
    return {
        "page_count": page_count,
        "searchable_page_count": searchable_pages,
        "text_extraction_status": (
            "searchable_text"
            if searchable_pages == page_count
            else "partial_text"
            if searchable_pages
            else "image_only"
        ),
        "relevance_band": band,
        "relevance_score": score,
        "matched_groups": {
            group: {"page_count": len(pages), "page_numbers": pages}
            for group, pages in normalized.items()
        },
        "regional_material_cooccurrence_pages": cooccurrence_pages,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text())
    report = json.loads(REPORT_PATH.read_text())
    records = {str(item["id"]): item for item in catalog["records"]}
    available = [
        row
        for row in report["download_results"]
        if row.get("status") in {"downloaded", "already_present"}
    ]
    screening: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    for index, download in enumerate(available, start=1):
        source_id = str(download["source_id"])
        path = ROOT / str(download["storage_key"])
        try:
            result = scan_pdf(path)
            result.update(
                {
                    "source_id": source_id,
                    "title": str(records[source_id]["title"]),
                    "year": str(records[source_id]["year"]),
                    "source_tier": str(records[source_id]["source_tier"]),
                    "canonical_url": str(records[source_id]["canonical_url"]),
                    "file_sha256": str(download.get("sha256") or sha256_file(path)),
                    "requires_page_review": True,
                    "accepted_as_evidence": False,
                    "sensitive_review_status": "pending",
                }
            )
            screening.append(result)
            print(f"[{index:02d}/{len(available)}] {result['relevance_band']:<27} {source_id}")
        except (OSError, RuntimeError, ValueError, KeyError) as exc:
            failures.append({"source_id": source_id, "error": str(exc)})
            print(f"[{index:02d}/{len(available)}] failed {source_id}: {exc}")

    screening.sort(key=lambda row: (-int(row["relevance_score"]), str(row["year"])))
    for rank, row in enumerate(screening, start=1):
        row["screening_rank"] = rank

    output = {
        "schema_version": "1.0",
        "generated_at": datetime.now(UTC).isoformat(),
        "method": "deterministic_local_term_screen_v1",
        "policy": {
            "stores_page_text": False,
            "stores_excerpts": False,
            "extracts_measurements": False,
            "sends_content_to_ai": False,
            "creates_evidence": False,
            "note": "Discovery ranking only; every candidate requires human page review.",
        },
        "scanned_file_count": len(screening),
        "failures": failures,
        "records": screening,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Screened {len(screening)} PDFs; {len(failures)} failures; wrote {args.output}.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
