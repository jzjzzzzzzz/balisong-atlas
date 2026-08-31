import hashlib
import json
from datetime import datetime, timezone
from pathlib import PurePath
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AtlasError
from app.models.domain import Asset, SensitiveContentFlag, SourceChunk, SourceRecord, SourceSnapshot
from app.services.ingestion.fetcher import fetch_approved_url
from app.services.ingestion.sensitive import (
    detect_sensitive_content,
    redact_controlled_text,
    redact_public_text,
)
from app.services.parsing.html_parser import parse_html
from app.services.parsing.image_processor import image_metadata, perceptual_hash
from app.services.parsing.pdf_parser import parse_pdf
from app.services.rights.rights_gate import evaluate_rights
from app.services.storage.factory import get_storage


async def _flags(session: AsyncSession, source_id: UUID, chunk: SourceChunk, text: str) -> None:
    for detection in detect_sensitive_content(text):
        session.add(SensitiveContentFlag(
            source_id=source_id,
            source_chunk_id=chunk.id,
            category=detection.category,
            detection_method="rule",
            confidence=detection.confidence,
            action=detection.action,
            reviewer_status="proposed",
        ))


async def _add_chunk(
    session: AsyncSession,
    source: SourceRecord,
    snapshot: SourceSnapshot,
    index: int,
    text: str,
    *,
    page_number: int | None = None,
    section_title: str = "",
    bbox: dict[str, Any] | None = None,
    ocr_generated: bool = False,
) -> SourceChunk:
    detections = detect_sensitive_content(text)
    controlled = any(item.category in {"exact_measurement", "manufacturing_instruction", "assembly_instruction", "operational_instruction", "purchasing_information"} for item in detections)
    chunk = SourceChunk(
        source_id=source.id,
        snapshot_id=snapshot.id,
        chunk_index=index,
        text=redact_controlled_text(text),
        public_safe_text=redact_public_text(text),
        page_number=page_number,
        section_title=section_title,
        start_offset=0,
        end_offset=len(text),
        bounding_box_json=bbox or {},
        language=source.original_language,
        token_count=max(1, len(text.split())),
        text_search_vector=redact_public_text(text),
        contains_sensitive_content=bool(detections),
        excluded_from_ai=controlled,
        excluded_from_public_search=controlled,
        ocr_generated=ocr_generated,
    )
    session.add(chunk)
    await session.flush()
    await _flags(session, source.id, chunk, text)
    if any(item.category == "exact_measurement" for item in detections):
        source.contains_sensitive_measurements = True
    if any(item.category == "operational_instruction" for item in detections):
        source.contains_operational_content = True
    return chunk


async def ingest_source_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    source_id = UUID(str(payload["source_id"]))
    snapshot_id = UUID(str(payload["snapshot_id"]))
    source = await session.get(SourceRecord, source_id)
    snapshot = await session.get(SourceSnapshot, snapshot_id)
    if source is None or snapshot is None or snapshot.source_id != source.id:
        raise ValueError("Source or snapshot does not exist")
    existing = await session.scalar(select(SourceChunk.id).where(SourceChunk.snapshot_id == snapshot.id).limit(1))
    if existing:
        source.processing_status = "processed"
        return {"status": "already_processed", "source_id": str(source.id)}
    storage = get_storage()
    content = await storage.get(snapshot.storage_key)
    created = 0
    if snapshot.mime_type == "application/pdf":
        parsed = parse_pdf(content)
        for index, block in enumerate(parsed.blocks):
            await _add_chunk(session, source, snapshot, index, block.text, page_number=block.page_number, bbox=block.bbox)
            created += 1
        for image_index, image in enumerate(parsed.images):
            key = await storage.put(image.content, f"image/{image.extension}")
            digest = hashlib.sha256(image.content).hexdigest()
            session.add(Asset(
                project_id=source.project_id, source_id=source.id, asset_type="image", storage_key=key,
                original_filename=f"embedded-page-{image.page_number}-{image_index}.{image.extension}",
                mime_type=f"image/{image.extension}", width=image.width, height=image.height, sha256=digest,
                perceptual_hash=perceptual_hash(image.content), rights_status=source.rights_status,
                attribution_text=source.attribution_text, public_display_allowed=source.public_display_allowed,
                is_synthetic=False,
            ))
        for page_number in parsed.ocr_pages:
            pending = await _add_chunk(session, source, snapshot, created, "[OCR required: no embedded text detected]", page_number=page_number, section_title="OCR pending")
            pending.excluded_from_ai = True
            pending.excluded_from_public_search = True
            from app.services.jobs import enqueue_job

            await enqueue_job(
                session,
                "run_ocr",
                {"source_id": str(source.id), "snapshot_id": str(snapshot.id), "page_number": page_number},
                f"ocr:{snapshot.id}:{page_number}",
            )
            created += 1
    elif snapshot.mime_type == "text/html":
        parsed_html = parse_html(content)
        if parsed_html.title and source.title.startswith("Pending"):
            source.title = redact_public_text(parsed_html.title, max_excerpt_chars=700)
        if parsed_html.author:
            source.creator = parsed_html.author
        if parsed_html.publication_date:
            source.publication_date_text = parsed_html.publication_date
        if parsed_html.canonical_url:
            source.canonical_url = parsed_html.canonical_url
        paragraphs = [paragraph for paragraph in parsed_html.text.split("\n") if paragraph]
        for index, paragraph in enumerate(paragraphs):
            await _add_chunk(session, source, snapshot, index, paragraph, section_title=parsed_html.title)
            created += 1
    elif snapshot.mime_type.startswith("text/"):
        text = content.decode("utf-8", errors="replace")
        paragraphs = [text[index:index + 1200] for index in range(0, len(text), 1200)] or [""]
        for index, paragraph in enumerate(paragraphs):
            await _add_chunk(session, source, snapshot, index, paragraph)
            created += 1
    elif snapshot.mime_type.startswith("image/"):
        existing_asset = await session.scalar(select(Asset).where(Asset.source_id == source.id, Asset.sha256 == snapshot.sha256))
        if existing_asset is None:
            width, height, _ = image_metadata(content)
            session.add(Asset(
                project_id=source.project_id, source_id=source.id, asset_type="image",
                storage_key=snapshot.storage_key, original_filename="snapshot-image", mime_type=snapshot.mime_type,
                width=width, height=height, sha256=snapshot.sha256, perceptual_hash=perceptual_hash(content),
                rights_status=source.rights_status, attribution_text=source.attribution_text,
                public_display_allowed=source.public_display_allowed, is_synthetic=False,
            ))
    else:
        raise ValueError(f"Unsupported snapshot MIME type: {snapshot.mime_type}")
    source.processing_status = "processed"
    return {"status": "processed", "source_id": str(source.id), "chunks_created": created}


async def fetch_url_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    source_id = UUID(str(payload["source_id"]))
    source = await session.get(SourceRecord, source_id)
    if source is None:
        raise ValueError("Source does not exist")
    settings = get_settings()
    result = await fetch_approved_url(
        str(payload["url"]), trusted_domains=settings.trusted_domains,
        administrator_approved=bool(payload.get("administrator_approved")), max_bytes=settings.max_fetch_bytes,
    )
    digest = hashlib.sha256(result.content).hexdigest()
    storage = get_storage()
    key = await storage.put(result.content, result.mime_type)
    snapshot = SourceSnapshot(
        source_id=source.id, storage_key=key, mime_type=result.mime_type, file_size=len(result.content),
        sha256=digest, fetched_at=datetime.now(timezone.utc), http_status=result.status_code,
        response_headers_json={key: value for key, value in result.headers.items() if key.lower() not in {"set-cookie", "authorization"}},
        parser_version="fetch-v1",
    )
    session.add(snapshot)
    await session.flush()
    source.canonical_url = result.final_url
    source.content_sha256 = digest
    return await ingest_source_handler(session, {"source_id": str(source.id), "snapshot_id": str(snapshot.id)})


async def import_iiif_handler(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    source_id = UUID(str(payload["source_id"]))
    source = await session.get(SourceRecord, source_id)
    if source is None:
        raise ValueError("IIIF source does not exist")
    settings = get_settings()
    result = await fetch_approved_url(
        str(payload["url"]), trusted_domains=settings.trusted_domains,
        administrator_approved=bool(payload.get("administrator_approved")), max_bytes=settings.max_fetch_bytes,
    )
    manifest = json.loads(result.content)
    digest = hashlib.sha256(result.content).hexdigest()
    storage = get_storage()
    key = await storage.put(result.content, "application/ld+json")
    snapshot = SourceSnapshot(
        source_id=source.id, storage_key=key, mime_type="application/ld+json", file_size=len(result.content),
        sha256=digest, fetched_at=datetime.now(timezone.utc), http_status=result.status_code,
        response_headers_json={key: value for key, value in result.headers.items() if key.lower() != "set-cookie"},
        parser_version="iiif-v3-v1",
    )
    session.add(snapshot)
    await session.flush()
    label = manifest.get("label", {})
    if isinstance(label, dict):
        values: list[Any] = next(iter(label.values()), [])
        source.title = (
            redact_public_text(str(values[0]), max_excerpt_chars=700)
            if values
            else source.title
        )
    source.rights_uri = str(manifest.get("rights", ""))
    rights_lower = source.rights_uri.lower()
    if "publicdomain" in rights_lower or "zero/" in rights_lower:
        source.rights_status = "public_domain"
    elif "creativecommons.org/licenses/" in rights_lower:
        source.rights_status = "licensed"
    else:
        source.rights_status = "unknown"
    source.license_label = source.rights_uri
    source.institution = ""
    providers = manifest.get("provider", [])
    if providers and isinstance(providers[0], dict):
        provider_label = providers[0].get("label", {})
        if isinstance(provider_label, dict):
            source.institution = str(next(iter(provider_label.values()), [""])[0])
    required = manifest.get("requiredStatement", {})
    source.attribution_text = " ".join(sum(required.get("value", {}).values(), [])) if isinstance(required, dict) else ""
    source.notes = f"IIIF canvases: {len(manifest.get('items', []))}; metadata imported without reproducing the full IIIF JSON in relational tables."
    metadata_text = "\n".join(
        f"{next(iter(item.get('label', {}).values()), [''])[0]}: {next(iter(item.get('value', {}).values()), [''])[0]}"
        for item in manifest.get("metadata", []) if isinstance(item, dict)
    )
    chunk_index = 0
    if metadata_text:
        await _add_chunk(session, source, snapshot, chunk_index, metadata_text, section_title="IIIF Manifest metadata")
        chunk_index += 1
    canvases = [item for item in manifest.get("items", []) if isinstance(item, dict)]
    annotation_count = 0
    candidate_images: list[tuple[str, str]] = []
    for canvas_number, canvas in enumerate(canvases, start=1):
        canvas_label_values: list[Any] = next(iter(canvas.get("label", {}).values()), [])
        canvas_label = str(canvas_label_values[0]) if canvas_label_values else f"Canvas {canvas_number}"
        canvas_lines = [f"Canvas: {canvas_label}", f"Canvas identifier: {canvas.get('id', '')}"]
        for annotation_page in canvas.get("items", []):
            if not isinstance(annotation_page, dict):
                continue
            for annotation in annotation_page.get("items", []):
                if not isinstance(annotation, dict):
                    continue
                annotation_count += 1
                canvas_lines.append(f"Annotation identifier: {annotation.get('id', '')}")
                bodies = annotation.get("body", [])
                if isinstance(bodies, dict):
                    bodies = [bodies]
                for body in bodies if isinstance(bodies, list) else []:
                    if not isinstance(body, dict):
                        continue
                    body_id = str(body.get("id", ""))
                    body_format = str(body.get("format", ""))
                    canvas_lines.append(
                        f"Annotation body: {body_id}; type={body.get('type', '')}; format={body_format}"
                    )
                    if body_id.startswith(("http://", "https://")) and (
                        body_format.startswith("image/") or body.get("type") == "Image"
                    ):
                        candidate_images.append((body_id, "image"))
        await _add_chunk(
            session,
            source,
            snapshot,
            chunk_index,
            "\n".join(canvas_lines),
            page_number=canvas_number,
            section_title=canvas_label,
        )
        chunk_index += 1
    thumbnails = manifest.get("thumbnail", [])
    if isinstance(thumbnails, dict):
        thumbnails = [thumbnails]
    for thumbnail in thumbnails if isinstance(thumbnails, list) else []:
        if isinstance(thumbnail, dict) and str(thumbnail.get("id", "")).startswith(("http://", "https://")):
            candidate_images.append((str(thumbnail["id"]), "thumbnail"))
    rights = evaluate_rights(source.rights_status, source.attribution_text)
    assets_cached = 0
    cache_errors: list[str] = []
    for image_url, kind in candidate_images:
        if kind == "image" and not rights.may_display_original:
            continue
        if kind == "thumbnail" and source.rights_status == "restricted":
            continue
        try:
            image_result = await fetch_approved_url(
                image_url,
                trusted_domains=settings.trusted_domains,
                administrator_approved=bool(payload.get("administrator_approved")),
                max_bytes=min(settings.max_fetch_bytes, 10_485_760),
            )
        except AtlasError as exc:
            cache_errors.append(exc.code)
            continue
        if not image_result.mime_type.startswith("image/"):
            continue
        width, height, _ = image_metadata(image_result.content)
        image_digest = hashlib.sha256(image_result.content).hexdigest()
        existing_asset = await session.scalar(
            select(Asset.id).where(Asset.source_id == source.id, Asset.sha256 == image_digest)
        )
        if existing_asset:
            continue
        image_key = await storage.put(image_result.content, image_result.mime_type)
        filename = PurePath(urlparse(image_result.final_url).path).name or f"iiif-{kind}"
        session.add(Asset(
            project_id=source.project_id,
            source_id=source.id,
            asset_type="image" if kind == "image" else "thumbnail",
            storage_key=image_key,
            original_filename=filename,
            mime_type=image_result.mime_type,
            width=width,
            height=height,
            sha256=image_digest,
            perceptual_hash=perceptual_hash(image_result.content),
            rights_status=source.rights_status,
            attribution_text=source.attribution_text,
            public_display_allowed=rights.may_display_original,
            is_synthetic=False,
        ))
        assets_cached += 1
    source.processing_status = "processed"
    source.content_sha256 = digest
    return {
        "status": "processed",
        "source_id": str(source.id),
        "canvases": len(canvases),
        "annotations": annotation_count,
        "assets_cached": assets_cached,
        "cache_errors": sorted(set(cache_errors)),
        "high_resolution_cached": bool(assets_cached and rights.may_display_original),
    }
