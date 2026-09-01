from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def test_open_media_register_has_local_files_rights_and_evidence_limits() -> None:
    root = Path(__file__).resolve().parents[3]
    register: dict[str, Any] = json.loads(
        (root / "data/research/media-register.json").read_text(encoding="utf-8")
    )
    records = register["records"]

    assert len(records) == 9
    assert sum(record["source_type"] == "motion_record" for record in records) == 3
    assert {record["source_family"] for record in records if record["source_type"] == "motion_record"} == {
        "wikimedia-uploader:djlo",
        "wikimedia-uploader:gumballwolf",
    }

    for record in records:
        assert record["rights_status"] == "licensed"
        assert record["public_display_allowed"] is True
        assert record["license_url"].startswith("https://creativecommons.org/")
        assert record["source_url"].startswith("https://commons.wikimedia.org/wiki/File:")
        assert record["source_tier"] == "D"
        assert record["evidence_limit"]
        assert record["is_historical_form_evidence"] is False

        local_file = root / "apps/web/public" / record["local_path"].removeprefix("/")
        assert local_file.is_file()
        assert local_file.stat().st_size == record["file_size"]
        assert hashlib.sha256(local_file.read_bytes()).hexdigest() == record["sha256"]


def test_motion_media_is_excluded_from_corpus_qa() -> None:
    root = Path(__file__).resolve().parents[3]
    records: list[dict[str, Any]] = json.loads(
        (root / "data/research/media-register.json").read_text(encoding="utf-8")
    )["records"]
    motion = [record for record in records if record["source_type"] == "motion_record"]

    assert motion
    assert all(record["contains_operational_content"] for record in motion)
    assert all(record["excluded_from_corpus_qa"] for record in motion)
