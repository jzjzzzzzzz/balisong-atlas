#!/usr/bin/env python3
"""Collect a small, reviewed set of openly licensed Wikimedia media.

This script is intentionally allow-list based. It does not crawl or search, and it
stores only media that has been manually screened for the public media-history
workspace. Historical and object-date claims in uploader titles remain unverified.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "research" / "media"
REGISTER_PATH = ROOT / "data" / "research" / "media-register.json"
API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "BalisongAtlasResearch/0.1 (evidence-first digital humanities project)"
MAX_BYTES = 16 * 1024 * 1024


@dataclass(frozen=True)
class MediaTarget:
    identifier: str
    title: str
    local_name: str
    media_type: str
    creator: str
    source_date: str
    license_label: str
    license_url: str
    evidence_role: str
    evidence_limit: str
    contains_operational_content: bool = False
    use_original: bool = False


TARGETS = (
    MediaTarget(
        "commons-motion-djlo-2011-long",
        "Opening and closing a Balisong aka Butterfly Knife.gif",
        "opening-closing-djlo.gif",
        "motion_record",
        "DJLO",
        "2011-07-26",
        "CC BY-SA 3.0",
        "https://creativecommons.org/licenses/by-sa/3.0/",
        "Broad external-body sequence and whole-object orientation reference",
        "Modern self-published motion record; not evidence of historical performance, technique, or chronology.",
        contains_operational_content=True,
        use_original=True,
    ),
    MediaTarget(
        "commons-motion-djlo-2011-short",
        "Opening and closing a balisong simple.gif",
        "opening-closing-simple-djlo.gif",
        "motion_record",
        "DJLO",
        "2011-07-29",
        "CC BY-SA 3.0",
        "https://creativecommons.org/licenses/by-sa/3.0/",
        "Second broad pose-order reference from the same source family",
        "Same creator/source family as the longer record; it is not independent corroboration and is not an instructional source.",
        contains_operational_content=True,
        use_original=True,
    ),
    MediaTarget(
        "commons-motion-gumballwolf-2020",
        "A little bit of flipping.gif",
        "performance-loop-gumballwolf.gif",
        "motion_record",
        "Gumballwolf",
        "2020-09-30",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
        "Independent modern performance-envelope check for whole-object continuity",
        "Modern self-published performance media; not evidence of historical motion and never presented as a tutorial.",
        contains_operational_content=True,
        use_original=True,
    ),
    MediaTarget(
        "commons-ringer-open-2016",
        "Balisong open.jpg",
        "balisong-open-ringer.jpg",
        "photograph",
        "Ringer",
        "2016-01-06",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
        "Contemporary visible open-state appearance",
        "Supports only visible appearance in this photograph; it does not establish date, origin, dimensions, or internal structure.",
    ),
    MediaTarget(
        "commons-ringer-closed-2016",
        "Balisong closed.jpg",
        "balisong-closed-ringer.jpg",
        "photograph",
        "Ringer",
        "2016-01-06",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
        "Matched contemporary closed-state appearance",
        "Supports only visible appearance in this photograph; it does not establish date, origin, dimensions, or internal structure.",
    ),
    MediaTarget(
        "commons-baling-sungay-2021",
        "BALING SUNGAY.jpg",
        "baling-sungay-melchior22.jpg",
        "photograph",
        "Melchior22",
        "2021-05-21",
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
        "Contemporary surface, color, and material-appearance observation",
        "The uploader description is not accepted as historical evidence; the photograph supports visible appearance only.",
    ),
    MediaTarget(
        "commons-open-closed-2013",
        "ButterflyKnifeOpenandClosed.jpg",
        "open-closed-comparison-iamthawalrus.jpg",
        "photograph",
        "Iamthawalrus",
        "2013-05-08",
        "CC BY-SA 3.0",
        "https://creativecommons.org/licenses/by-sa/3.0/",
        "Contemporary open/closed silhouette comparison",
        "Supports a broad visible silhouette comparison only; no scale, mechanism, or historical inference is extracted.",
        use_original=True,
    ),
    MediaTarget(
        "commons-police-museum-2014",
        "West Midlands Police Museum (13176531015).jpg",
        "police-museum-display-sasha-taylor.jpg",
        "photograph",
        "Sasha Taylor",
        "2014-03-15",
        "CC BY-SA 2.0",
        "https://creativecommons.org/licenses/by-sa/2.0/",
        "Museum-display and photographic context",
        "The page provides no reviewed object-level catalogue metadata; it is contextual imagery, not a provenance record.",
    ),
    MediaTarget(
        "commons-before-1982-lead-2025",
        "Balisong, made before 1982.jpg",
        "before-1982-provenance-lead-szilas.jpg",
        "photograph",
        "Szilas",
        "2025-12-13",
        "CC BY 4.0",
        "https://creativecommons.org/licenses/by/4.0/",
        "Unverified provenance lead and multi-material appearance observation",
        "The object date appears only in the uploader title and is not verified by catalogue or provenance evidence.",
    ),
)


def api_metadata(title: str) -> dict[str, Any]:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": 1280,
            "titles": f"File:{title}",
        }
    )
    request = urllib.request.Request(  # noqa: S310 - fixed HTTPS host
        f"{API_URL}?{query}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=30) as response:  # noqa: S310 - fixed HTTPS host
        payload = json.load(response)
    page = next(iter(payload["query"]["pages"].values()))
    return page["imageinfo"][0]


def download(url: str, target: Path) -> bytes:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {
        "upload.wikimedia.org",
        "thumb.wikimedia.org",
    }:
        raise ValueError(f"Rejected non-Wikimedia media URL: {url}")
    request = urllib.request.Request(  # noqa: S310 - validated HTTPS Wikimedia host
        url, headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=90) as response:  # noqa: S310 - URL returned by fixed API
        mime = response.headers.get_content_type()
        if not (mime.startswith("image/") and mime != "image/svg+xml"):
            raise ValueError(f"Unexpected media type for {target.name}: {mime}")
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError(f"Media exceeds {MAX_BYTES} bytes: {target.name}")
    target.write_bytes(data)
    return data


def image_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        return image.size


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, Any]] = []
    for target in TARGETS:
        info = api_metadata(target.title)
        source_url = f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(target.title.replace(' ', '_'))}"
        media_url = info["url"] if target.use_original else info.get("thumburl", info["url"])
        output = OUTPUT_DIR / target.local_name
        data = download(media_url, output)
        width, height = image_size(output)
        mime = mimetypes.guess_type(output.name)[0] or info["mime"]
        records.append(
            {
                "id": target.identifier,
                "source_type": target.media_type,
                "title": target.title,
                "creator": target.creator,
                "source_date": target.source_date,
                "source_url": source_url,
                "license": target.license_label,
                "license_url": target.license_url,
                "rights_status": "licensed",
                "public_display_allowed": True,
                "local_path": f"/research/media/{target.local_name}",
                "mime_type": mime,
                "width": width,
                "height": height,
                "sha256": hashlib.sha256(data).hexdigest(),
                "file_size": len(data),
                "source_tier": "D",
                "source_family": f"wikimedia-uploader:{target.creator.casefold()}",
                "evidence_role": target.evidence_role,
                "evidence_limit": target.evidence_limit,
                "contains_operational_content": target.contains_operational_content,
                "excluded_from_corpus_qa": target.contains_operational_content,
                "is_historical_form_evidence": False,
                "derivative_note": "Local copy of original" if target.use_original else "Local copy of Wikimedia 1280px thumbnail",
            }
        )

    register = {
        "schema_version": "1.0",
        "generated_at": datetime.now(UTC).isoformat(),
        "collection_method": "Manually reviewed allow-list; Wikimedia Commons API; no crawling",
        "policy_note": "Licensing permits display; it does not verify uploader descriptions, object dates, origin, or historical performance.",
        "records": records,
    }
    REGISTER_PATH.write_text(json.dumps(register, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Collected {len(records)} media records in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
