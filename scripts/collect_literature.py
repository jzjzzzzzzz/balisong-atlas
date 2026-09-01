#!/usr/bin/env python3
"""Build the literature register and download allow-listed research copies.

Downloads are deliberately kept outside Git in content-addressed storage.  A
download is *not* an ingestion decision: every file remains excluded from AI,
embeddings, public search, and publication until a researcher has completed the
sensitive-content and rights review.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import shutil
import tempfile
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "research" / "bibliography.json"
REPORT_PATH = ROOT / "data" / "research" / "download-report.json"
CAS_ROOT = ROOT / "data" / "storage" / "research" / "sha256"
USER_AGENT = "BalisongAtlasResearchCollector/1.0 (+https://github.com/jzjzzzzzzz/balisong-atlas)"
ALLOWED_DOWNLOAD_HOSTS = {
    "archive.org",
    "nlpdl.nlp.gov.ph",
    "repository.si.edu",
    "resources.metmuseum.org",
    "upload.wikimedia.org",
}


PHILIPPINE_CRAFTSMAN_IDS = (
    "acw9599.0001.001.umich.edu",
    "acw9599.0001.002.umich.edu",
    "acw9599.0001.003.umich.edu",
    "acw9599.0001.004.umich.edu",
    "acw9599.0001.005.umich.edu",
    "acw9599.0001.006.umich.edu",
    "acw9599.0001.007.umich.edu",
    "acw9599.0001.008.umich.edu",
    "acw9599.0001.009.umich.edu",
    "acw9599.0002.001.umich.edu",
    "acw9599.0002.002.umich.edu",
    "acw9599.0002.003.umich.edu",
    "acw9599.0002.004.umich.edu",
    "acw9599.0002.005.umich.edu",
    "acw9599.0002.006.umich.edu",
    "acw9599.0002.007.umich.edu",
    "acw9599.0002.008.umich.edu",
    "acw9599.0002.009.umich.edu",
    "acw9599.0003.001.umich.edu",
    "acw9599.0005.002.umich.edu",
    "acw9599.0005.003.umich.edu",
    "acw9599.0005.004.umich.edu",
)

IA_BOOK_IDS = (
    "filipinaspequeo01sastgoog",
    "island00forephilippinerich",
    "philippinelifei01lerogoog",
    "philippinespast00unkngoog",
    "bontocigorot00jenkgoog",
    "apronouncinggaz00keimgoog",
    "officialhandboo00wilsgoog",
    "reportofphilippi00philrich",
    "wildtribesofdava122cole",
    "ajb5834.0004.001.umich.edu",
    "officialcatalogu00loui_2",
    "souvenirofphilip00loui",
)

# A deliberately broad second tranche of public-domain scans.  These are
# research leads, not accepted evidence: the catalogue keeps every item private
# and outside AI/search until page-level review and sensitive-content redaction.
OFFICIAL_RECORD_IDS = (
    "censusphilippin01ganngoog",
    "censusphilippin02ganngoog",
    "censusphilippin03ganngoog",
    "reportofphilippi01unit",
    "reportofphilipp02unit",
    "reportofphilipp03unit",
    "reportofphilippi02unit",
    "reportofphilip00unit",
    "reportofphil00unit",
)

PHILIPPINE_JOURNAL_OF_SCIENCE_IDS = (
    "philippinejourn31908phil",
    "philippinejourna51910phil",
    "philippinejourna71912ph",
    "philippinejourna81913ph",
    "philippinejourn91914phil",
    "philippinejour101915phil",
    "philippinej111916phil",
    "philippinejour121917phil",
    "philippinejour131918phil",
    "philippinejourn141919phil",
)

EXPANDED_HISTORICAL_BOOK_IDS = (
    "atf7593.0001.001.umich.edu",
    "atf7591.0001.001.umich.edu",
    "atf7597.0001.001.umich.edu",
    "traditionsofting141cole",
    "ifugaolawroy00bartrich",
    "negritosofzambal00reed",
    "tinguiansocialre142cole",
    "divisionethnolo00ethngoog",
    "aja8481.0001.001.umich.edu",
    "filipinopopular00fansgoog",
    "philippinefolklo00millrich",
    "afl2786.0001.001.umich.edu",
    "philippineislan00worcgoog",
    "historyofphilipp00barriala",
    "shorthistoryofph00jernrich",
    "cu31924023453776",
    "commercialgeogra00millrich",
    "afq6770.0001.001.umich.edu",
    "economicconditio00millrich",
    "peoplephilippin00affagoog",
)

DIRECT_SOURCES: tuple[dict[str, Any], ...] = (
    {
        "id": "krieger-1926-usnm-bulletin-137",
        "title": "The Collection of Primitive Weapons and Armor of the Philippine Islands in the United States National Museum",
        "creator": "Herbert W. Krieger",
        "year": "1926",
        "source_kind": "museum_monograph",
        "priority_class": "book",
        "source_tier": "A",
        "institution": "Smithsonian Institution",
        "canonical_url": "https://doi.org/10.5479/si.03629236.137.1",
        "download_url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Bulletin_-_United_States_National_Museum_%28IA_bulletinunitedst1371926unit%29.pdf",
        "rights_status": "public_domain",
        "rights_note": "Smithsonian repository marks this item No Copyright - United States.",
        "relevance": "Early museum catalogue for Philippine material culture; claim-level use requires page review.",
        "safety_flags": ["exact_measurement", "mechanism", "manufacturing"],
    },
    {
        "id": "ccp-encyclopedia-metalcraft-1994",
        "title": "Metalcraft",
        "container_title": "CCP Encyclopedia of Philippine Art, Visual Arts",
        "creator": "Cultural Center of the Philippines editorial project",
        "year": "1994",
        "source_kind": "reference_book_chapter",
        "priority_class": "book",
        "source_tier": "B",
        "institution": "Cultural Center of the Philippines / National Library of the Philippines",
        "canonical_url": "https://epa.culturalcenter.gov.ph/project_intro_to_sections/",
        "download_url": "https://nlpdl.nlp.gov.ph/CC01/monographs/1994/NLP00VM052mcd/v3/v17.pdf",
        "rights_status": "restricted",
        "rights_note": "Research copy only; public display is not authorized by this register.",
        "relevance": "Philippine metalcraft context and bibliography; contains controlled passages.",
        "safety_flags": [
            "exact_measurement",
            "manufacturing",
            "operational_instruction",
            "copyright_risk",
        ],
    },
    {
        "id": "met-gods-of-war",
        "title": "The Gods of War: Sacred Imagery and the Decoration of Arms and Armor",
        "creator": "Donald J. La Rocca",
        "year": "1996",
        "source_kind": "museum_scholarly_publication",
        "priority_class": "book",
        "source_tier": "B",
        "institution": "The Metropolitan Museum of Art",
        "canonical_url": "https://www.metmuseum.org/met-publications/the-gods-of-war-sacred-imagery-and-the-decoration-of-arms-and-armor",
        "download_url": "https://resources.metmuseum.org/resources/metpublications/pdf/The_Gods_of_War_Sacred_Imagery_and_the_Decoration_of_Arms_and_Armor.pdf",
        "rights_status": "metadata_only",
        "rights_note": "Downloaded as a private research copy; reuse requires item-level rights review.",
        "relevance": "Comparative museum scholarship on sacred imagery and decorated arms; contextual only.",
        "safety_flags": ["exact_measurement", "mechanism", "copyright_risk"],
    },
)

METADATA_ONLY_SOURCES: tuple[dict[str, Any], ...] = (
    {
        "id": "galvan-2016-dlsu-thesis",
        "title": "Ang balisong bilang sagisag-kultura ng Barangay Balisong, Taal, Batangas City",
        "creator": "Daniel John Felix G. Galvan",
        "year": "2016",
        "source_kind": "undergraduate_thesis",
        "priority_class": "paper",
        "source_tier": "B",
        "institution": "De La Salle University",
        "canonical_url": "https://animorepository.dlsu.edu.ph/etd_bachelors/2831/",
        "rights_status": "metadata_only",
        "rights_note": "Institutional record available; full text is not publicly downloadable.",
        "relevance": "Direct cultural-significance research lead; use only after obtaining the thesis.",
        "safety_flags": ["exact_measurement", "manufacturing"],
    },
    {
        "id": "batangas-historical-data-1946-1951",
        "title": "Historical data for the province of Batangas",
        "creator": "Philippine local-history compilation",
        "year": "1946–1951",
        "source_kind": "archival_microfilm",
        "priority_class": "archive",
        "source_tier": "A",
        "institution": "National Library of the Philippines",
        "canonical_url": "https://www.elib.gov.ph/details.php?uid=c62d892e4b1d809c4a4a339d55e3d021",
        "rights_status": "metadata_only",
        "rights_note": "Catalogue metadata only; consult the holding institution for access.",
        "relevance": "Retrospective local-history collection including Taal; not contemporary evidence for earlier dates.",
        "safety_flags": ["manufacturing", "operational_instruction"],
    },
    {
        "id": "villegas-batangas-forged-in-fire-2002",
        "title": "Batangas: Forged in Fire",
        "creator": "Ramon N. Villegas (editor)",
        "year": "2002",
        "source_kind": "edited_book",
        "priority_class": "book",
        "source_tier": "B",
        "institution": "Batangas Province / Philippine eLib catalogue",
        "canonical_url": "https://www.elib.gov.ph/details.php?uid=ea527f0ec2a5526682842487a58542a1",
        "rights_status": "metadata_only",
        "rights_note": "No digital copy is offered by the catalogue.",
        "relevance": "Regional historical context; requires access and chapter-level evaluation.",
        "safety_flags": [],
    },
    {
        "id": "marinas-pananandata-2002",
        "title": "Pananandata: History and Techniques of Traditional Weapons of the Philippines",
        "creator": "Amante P. Marinas",
        "year": "2002",
        "source_kind": "book",
        "priority_class": "book",
        "source_tier": "C",
        "institution": "Philippine eLib catalogue",
        "canonical_url": "https://www.elib.gov.ph/results.php?f=subject&q=Martial+arts+weapons+--+Philippines+--+History",
        "rights_status": "restricted",
        "rights_note": "Metadata lead only; operational scope excludes it from AI and public search.",
        "relevance": "Bibliographic lead whose historical references may be audited separately.",
        "safety_flags": ["operational_instruction", "manufacturing"],
    },
    {
        "id": "campbell-cagaanan-umpad-balisong-1986",
        "title": "Balisong",
        "creator": "Sid Campbell, Gary Cagaanan, and Sonny Umpad",
        "year": "1986",
        "source_kind": "book",
        "priority_class": "book",
        "source_tier": "C",
        "institution": "Open Library catalogue",
        "canonical_url": "https://openlibrary.org/books/OL2292919M/Balisong",
        "rights_status": "restricted",
        "rights_note": "Controlled digital lending record; no file is downloaded by this project.",
        "relevance": "Later narrative to audit for citation lineage, not a primary historical source.",
        "safety_flags": ["operational_instruction"],
    },
    {
        "id": "jansen-clasp-knife-patent-1880",
        "title": "Clasp-Knife, US Patent 229,706",
        "creator": "Edmund Jansen",
        "year": "1880",
        "source_kind": "patent",
        "priority_class": "archive",
        "source_tier": "A",
        "institution": "United States Patent Office",
        "canonical_url": "https://patents.google.com/patent/US229706A/en",
        "rights_status": "public_domain",
        "rights_note": "Patent record; metadata only in the public register because the document is mechanically detailed.",
        "relevance": "Comparative primary record for chronology and terminology; not evidence of Philippine origin.",
        "safety_flags": ["exact_measurement", "mechanism", "manufacturing", "assembly_instruction"],
    },
    {
        "id": "met-luzon-knife-317185",
        "title": "Knife, Luzon, late 19th–early 20th century",
        "creator": "Unrecorded maker",
        "year": "late 19th–early 20th century",
        "source_kind": "museum_object_record",
        "priority_class": "archive",
        "source_tier": "A",
        "institution": "The Metropolitan Museum of Art",
        "canonical_url": "https://www.metmuseum.org/art/collection/search/317185",
        "rights_status": "metadata_only",
        "rights_note": "Object metadata lead; asset rights require separate review.",
        "relevance": "Regional material-appearance context, not a balisong identification.",
        "safety_flags": ["exact_measurement"],
    },
    {
        "id": "thiers-museum-cutlery",
        "title": "Musée de la Coutellerie, Thiers",
        "creator": "Ville de Thiers",
        "year": "current institutional record",
        "source_kind": "museum_institution_record",
        "priority_class": "institutional_web",
        "source_tier": "A",
        "institution": "Ville de Thiers / Ministère de la Culture",
        "canonical_url": "https://pop.culture.gouv.fr/notice/museo/M0129",
        "rights_status": "metadata_only",
        "rights_note": "Institution metadata only.",
        "relevance": "Contact and collection lead for testing unverified French-origin narratives.",
        "safety_flags": [],
    },
    {
        "id": "batangas-history-taal-transcription-part-3",
        "title": "Historical Data of Taal, Batangas, Part III (web transcription)",
        "creator": "Batangas History, Culture and Folklore",
        "year": "2023 transcription of mid-20th-century records",
        "source_kind": "web_transcription",
        "priority_class": "web_post",
        "source_tier": "D",
        "institution": "Independent web project",
        "canonical_url": "https://www.batangashistory.date/2023/06/taal-historical-data-part-3.html",
        "rights_status": "metadata_only",
        "rights_note": "Use as a discovery aid; verify against the archival holding.",
        "relevance": "Transcription lead, not an independent or contemporaneous source.",
        "safety_flags": ["manufacturing", "operational_instruction", "copyright_risk"],
    },
)


@dataclass(frozen=True)
class DownloadTarget:
    source_id: str
    url: str
    expected_size: int | None
    filename: str


def request_json(url: str) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(3):
        request = urllib.request.Request(  # noqa: S310 - fixed Internet Archive HTTPS URL
            url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:  # noqa: S310
                payload: dict[str, Any] = json.load(response)
            return payload
        except (TimeoutError, OSError) as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2**attempt)
    assert last_error is not None
    raise last_error


def normalize_metadata_value(value: object) -> str:
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    return str(value or "")


def select_archive_pdf(files: list[dict[str, Any]]) -> tuple[str, int] | None:
    candidates: list[tuple[int, int, str]] = []
    for file in files:
        name = str(file.get("name", ""))
        if not name.lower().endswith(".pdf") or "encrypted" in name.lower() or file.get("private"):
            continue
        try:
            size = int(file.get("size", 0))
        except (TypeError, ValueError):
            size = 0
        preference = 0 if re.search(r"(?:_text)?\.pdf$", name) and "_bw.pdf" not in name else 1
        candidates.append((preference, size, name))
    if not candidates:
        return None
    candidates.sort(key=lambda row: (row[0], row[1]))
    _, size, name = candidates[0]
    return name, size


def archive_record(
    identifier: str, priority_class: str
) -> tuple[dict[str, Any], DownloadTarget | None]:
    if not re.fullmatch(r"[A-Za-z0-9._-]+", identifier):
        raise ValueError(f"Invalid Internet Archive identifier: {identifier}")
    metadata_url = f"https://archive.org/metadata/{identifier}"
    payload = request_json(metadata_url)
    metadata = payload.get("metadata", {})
    selected = select_archive_pdf(payload.get("files", []))
    source_id = f"ia-{identifier}"
    title = normalize_metadata_value(metadata.get("title"))
    year = normalize_metadata_value(metadata.get("date") or metadata.get("year"))[:10]
    record: dict[str, Any] = {
        "id": source_id,
        "title": title,
        "creator": normalize_metadata_value(metadata.get("creator")) or "Creator not normalized",
        "year": year or "Date not normalized",
        "source_kind": (
            "historical_periodical"
            if priority_class == "period_publication"
            else "official_record"
            if priority_class == "archive"
            else "historical_book"
        ),
        "priority_class": priority_class,
        "source_tier": "A",
        "institution": normalize_metadata_value(metadata.get("contributor"))
        or "Internet Archive contributing library",
        "canonical_url": f"https://archive.org/details/{identifier}",
        "rights_status": "public_domain",
        "rights_note": "Historical scan; item-level rights metadata and contributing-library terms still apply.",
        "relevance": (
            "Contemporary Philippine industrial and craft periodical; search lead only until issue-level review."
            if priority_class == "period_publication"
            else "Historical Philippine regional, social, commercial, or material-culture context; claim-level use requires page review."
        ),
        "safety_flags": ["exact_measurement", "manufacturing", "operational_instruction"],
        "internet_archive_identifier": identifier,
        "metadata_url": metadata_url,
    }
    target = None
    if selected:
        filename, size = selected
        target = DownloadTarget(
            source_id,
            f"https://archive.org/download/{identifier}/{urllib.parse.quote(filename)}",
            size,
            filename,
        )
        record["download_url"] = target.url
        record["download_size_bytes"] = size
    return record, target


def finalize_record(record: dict[str, Any]) -> dict[str, Any]:
    output = dict(record)
    output["public_display_allowed"] = False
    output["research_copy_only"] = True
    output["sensitive_review_status"] = "pending"
    output["excluded_from_ai"] = True
    output["excluded_from_embeddings"] = True
    output["excluded_from_public_search"] = True
    return output


def validate_download_url(url: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_DOWNLOAD_HOSTS:
        raise ValueError(f"Download host is not allow-listed: {url}")


def download(target: DownloadTarget, max_bytes: int) -> dict[str, Any]:
    validate_download_url(target.url)
    if target.expected_size and target.expected_size > max_bytes:
        return {
            "source_id": target.source_id,
            "status": "skipped_size_limit",
            "original_filename": target.filename,
            "expected_bytes": target.expected_size,
        }
    CAS_ROOT.mkdir(parents=True, exist_ok=True)
    hasher = hashlib.sha256()
    byte_count = 0
    request = urllib.request.Request(  # noqa: S310 - URL is checked against the HTTPS allow-list above
        target.url, headers={"User-Agent": USER_AGENT, "Accept": "application/pdf"}
    )
    with tempfile.NamedTemporaryFile(dir=CAS_ROOT, delete=False) as temporary:
        temporary_path = Path(temporary.name)
        try:
            with urllib.request.urlopen(request, timeout=120) as response:  # noqa: S310 - allow-listed above
                content_type = response.headers.get_content_type()
                if content_type not in {
                    "application/pdf",
                    "application/octet-stream",
                    "binary/octet-stream",
                }:
                    raise ValueError(f"Unexpected MIME type {content_type} for {target.source_id}")
                first_chunk = True
                while chunk := response.read(1024 * 1024):
                    if first_chunk and not chunk.startswith(b"%PDF-"):
                        raise ValueError(
                            f"Response does not have a PDF signature for {target.source_id}"
                        )
                    first_chunk = False
                    byte_count += len(chunk)
                    if byte_count > max_bytes:
                        raise ValueError(f"Response exceeded {max_bytes} bytes")
                    hasher.update(chunk)
                    temporary.write(chunk)
            digest = hasher.hexdigest()
            destination = CAS_ROOT / digest[:2] / f"{digest}.pdf"
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists():
                shutil.move(str(temporary_path), destination)
            else:
                temporary_path.unlink(missing_ok=True)
            return {
                "source_id": target.source_id,
                "status": "downloaded",
                "original_filename": target.filename,
                "sha256": digest,
                "bytes": byte_count,
                "storage_key": str(destination.relative_to(ROOT)),
            }
        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise


def priority(record: dict[str, Any]) -> tuple[int, str, str]:
    weights = {
        "archive": 0,
        "book": 1,
        "period_publication": 2,
        "paper": 3,
        "institutional_web": 4,
        "web_post": 5,
    }
    return (
        weights.get(str(record.get("priority_class")), 9),
        str(record.get("year")),
        str(record.get("title")),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download allow-listed research copies into ignored CAS storage",
    )
    parser.add_argument("--jobs", type=int, default=4, help="Concurrent download count")
    parser.add_argument("--max-item-mb", type=int, default=140, help="Per-file download ceiling")
    parser.add_argument(
        "--refresh-metadata",
        action="store_true",
        help="Refresh Internet Archive metadata instead of using the tracked register",
    )
    args = parser.parse_args()

    records = [finalize_record(item) for item in (*DIRECT_SOURCES, *METADATA_ONLY_SOURCES)]
    targets = [
        DownloadTarget(
            str(item["id"]),
            str(item["download_url"]),
            None,
            Path(str(item["download_url"])).name or f"{item['id']}.pdf",
        )
        for item in DIRECT_SOURCES
    ]

    cached_archive_records: dict[str, dict[str, Any]] = {}
    if CATALOG_PATH.exists() and not args.refresh_metadata:
        cached_catalog = json.loads(CATALOG_PATH.read_text())
        cached_archive_records = {
            str(record["internet_archive_identifier"]): record
            for record in cached_catalog.get("records", [])
            if record.get("internet_archive_identifier")
        }

    def add_archive(identifier: str, priority_class: str) -> None:
        cached = cached_archive_records.get(identifier)
        if cached:
            record = dict(cached)
            target = None
            if record.get("download_url"):
                url = str(record["download_url"])
                filename = urllib.parse.unquote(Path(urllib.parse.urlparse(url).path).name)
                target = DownloadTarget(
                    str(record["id"]),
                    url,
                    int(record.get("download_size_bytes", 0)) or None,
                    filename,
                )
        else:
            record, target = archive_record(identifier, priority_class)
            record = finalize_record(record)
        records.append(record)
        if target:
            targets.append(target)

    for identifier in PHILIPPINE_CRAFTSMAN_IDS:
        add_archive(identifier, "period_publication")
    for identifier in IA_BOOK_IDS:
        add_archive(identifier, "book")
    for identifier in OFFICIAL_RECORD_IDS:
        add_archive(identifier, "archive")
    for identifier in PHILIPPINE_JOURNAL_OF_SCIENCE_IDS:
        add_archive(identifier, "period_publication")
    for identifier in EXPANDED_HISTORICAL_BOOK_IDS:
        add_archive(identifier, "book")

    records.sort(key=priority)
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(
        json.dumps({"schema_version": "1.0", "records": records}, ensure_ascii=False, indent=2)
        + "\n"
    )

    results: list[dict[str, Any]] = []
    if args.download:
        max_bytes = args.max_item_mb * 1024 * 1024
        previous: dict[str, dict[str, Any]] = {}
        if REPORT_PATH.exists():
            prior_report = json.loads(REPORT_PATH.read_text())
            previous = {
                str(row["source_id"]): row for row in prior_report.get("download_results", [])
            }
        pending: list[DownloadTarget] = []
        for target in targets:
            prior = previous.get(target.source_id)
            prior_path = ROOT / str(prior.get("storage_key", "")) if prior else None
            if (
                prior
                and prior.get("status") in {"downloaded", "already_present"}
                and prior_path
                and prior_path.is_file()
            ):
                kept = dict(prior)
                kept["status"] = "already_present"
                results.append(kept)
                print(f"{'already_present':>18}  {target.source_id}", flush=True)
            else:
                pending.append(target)
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
            future_map = {pool.submit(download, target, max_bytes): target for target in pending}
            for future in concurrent.futures.as_completed(future_map):
                target = future_map[future]
                try:
                    result = future.result()
                    print(f"{result['status']:>18}  {target.source_id}", flush=True)
                    results.append(result)
                except Exception as exc:  # surfaced in report; no failure is hidden
                    print(f"{'failed':>18}  {target.source_id}: {exc}", flush=True)
                    results.append(
                        {"source_id": target.source_id, "status": "failed", "error": str(exc)}
                    )

    report = {
        "schema_version": "1.0",
        "generated_at": datetime.now(UTC).isoformat(),
        "collector_version": "1.0",
        "catalog_records": len(records),
        "download_requested": bool(args.download),
        "download_results": sorted(results, key=lambda row: str(row["source_id"])),
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    downloaded = [
        result for result in results if result.get("status") in {"downloaded", "already_present"}
    ]
    print(
        f"Catalogued {len(records)} records; available {len(downloaded)} files ({sum(int(row.get('bytes', 0)) for row in downloaded):,} bytes)."
    )
    return 1 if any(result.get("status") == "failed" for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
