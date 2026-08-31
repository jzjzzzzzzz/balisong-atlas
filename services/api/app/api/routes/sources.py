import hashlib
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select

from app.api.utils import row_dict
from app.core.config import get_settings
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import Asset, SensitiveContentFlag, SourceChunk, SourceRecord, SourceSnapshot
from app.schemas.domain import IIIFSourceCreate, ManualSourceCreate, SourcePatch, URLSourceCreate
from app.services.audit import record_audit
from app.services.ingestion.upload_validation import validate_upload
from app.services.ingestion.url_safety import validate_external_url
from app.services.jobs import enqueue_job
from app.services.rights.rights_gate import evaluate_rights
from app.services.storage.factory import get_storage

router = APIRouter(tags=["sources"])
SOURCE_TYPE_BY_MIME = {
    "application/pdf": "pdf", "image/jpeg": "image", "image/png": "image", "image/webp": "image",
    "text/plain": "manual_note", "text/markdown": "manual_note", "text/html": "html",
}


@router.get("/projects/{project_id}/sources")
async def list_sources(project_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(SourceRecord).where(SourceRecord.project_id == project_id).order_by(SourceRecord.created_at.desc())))
    return [row_dict(item) for item in rows]


@router.post("/projects/{project_id}/sources/upload", status_code=201)
async def upload_source(
    project_id: UUID,
    request: Request,
    session: SessionDep,
    user: CurrentUser,
    file: UploadFile = File(...),
    title: str = Form(""),
    rights_status: str = Form("unknown"),
    source_tier: str = Form("D"),
    attribution_text: str = Form(""),
) -> dict[str, Any]:
    content = await file.read(get_settings().max_upload_bytes + 1)
    upload = validate_upload(file.filename or "upload", file.content_type or "application/octet-stream", content, get_settings().max_upload_bytes)
    digest = hashlib.sha256(upload.content).hexdigest()
    storage = get_storage()
    storage_key = await storage.put(upload.content, upload.mime_type)
    decision = evaluate_rights(rights_status, attribution_text)
    source = SourceRecord(
        project_id=project_id,
        source_type=SOURCE_TYPE_BY_MIME[upload.mime_type],
        title=title or upload.filename,
        rights_status=rights_status,
        attribution_text=attribution_text,
        source_tier=source_tier,
        source_quality_score={"A": 0.9, "B": 0.75, "C": 0.55, "D": 0.25}.get(source_tier, 0.25),
        content_sha256=digest,
        processing_status="pending",
        public_display_allowed=decision.may_display_original,
        created_by=user.id,
    )
    session.add(source)
    await session.flush()
    snapshot = SourceSnapshot(
        source_id=source.id, storage_key=storage_key, mime_type=upload.mime_type,
        file_size=len(upload.content), sha256=digest, fetched_at=datetime.now(timezone.utc),
        http_status=None, response_headers_json={}, parser_version="upload-v1",
    )
    session.add(snapshot)
    await session.flush()
    if source.source_type == "image":
        from app.services.parsing.image_processor import image_metadata, perceptual_hash

        width, height, _ = image_metadata(upload.content)
        asset = Asset(
            project_id=project_id, source_id=source.id, asset_type="image", storage_key=storage_key,
            original_filename=upload.filename, mime_type=upload.mime_type, width=width, height=height,
            sha256=digest, perceptual_hash=perceptual_hash(upload.content), rights_status=rights_status,
            attribution_text=attribution_text, public_display_allowed=decision.may_display_original,
            is_synthetic=False,
        )
        session.add(asset)
    job = await enqueue_job(session, "ingest_source", {"source_id": str(source.id), "snapshot_id": str(snapshot.id)}, f"ingest:{snapshot.id}")
    await record_audit(session, event_type="file_uploaded", entity_type="source_record", entity_id=source.id, actor_id=user.id, request_id=request.state.request_id, after={"sha256": digest, "mime_type": upload.mime_type, "snapshot_id": str(snapshot.id)})
    await session.commit()
    return {"source": row_dict(source), "snapshot": row_dict(snapshot), "job": row_dict(job)}


@router.post("/projects/{project_id}/sources/manual", status_code=201)
async def manual_source(project_id: UUID, payload: ManualSourceCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    decision = evaluate_rights(payload.rights_status, payload.attribution_text)
    source = SourceRecord(
        project_id=project_id, **payload.model_dump(),
        source_quality_score={"A": 0.9, "B": 0.75, "C": 0.55, "D": 0.25}[payload.source_tier],
        processing_status="metadata_only", public_display_allowed=decision.may_display_original, created_by=user.id,
    )
    session.add(source)
    await session.flush()
    await record_audit(session, event_type="source_recorded", entity_type="source_record", entity_id=source.id, actor_id=user.id, request_id=request.state.request_id, after=payload.model_dump(mode="json"))
    await session.commit()
    return row_dict(source)


async def _url_source(project_id: UUID, url: str, title: str, source_type: str, approved: bool, rights_status: str, source_tier: str, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    if approved and user.role != "admin":
        raise HTTPException(403, "Only an administrator can approve a non-trusted domain")
    settings = get_settings()
    await validate_external_url(url, trusted_domains=settings.trusted_domains, administrator_approved=approved)
    source = SourceRecord(
        project_id=project_id, source_type=source_type, title=title, original_url=url,
        canonical_url=url, accessed_at=datetime.now(timezone.utc), rights_status=rights_status,
        source_tier=source_tier, source_quality_score={"A": 0.9, "B": 0.75, "C": 0.55, "D": 0.25}[source_tier],
        processing_status="queued", public_display_allowed=False, created_by=user.id,
    )
    session.add(source)
    await session.flush()
    job_type = "import_iiif" if source_type == "iiif_manifest" else "fetch_url"
    job = await enqueue_job(session, job_type, {"source_id": str(source.id), "url": url, "administrator_approved": approved}, f"{job_type}:{source.id}:1")
    await record_audit(session, event_type="source_url_recorded", entity_type="source_record", entity_id=source.id, actor_id=user.id, request_id=request.state.request_id, after={"url": url, "job_id": str(job.id)})
    await session.commit()
    return {"source": row_dict(source), "job": row_dict(job)}


@router.post("/projects/{project_id}/sources/url", status_code=201)
async def url_source(project_id: UUID, payload: URLSourceCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _url_source(project_id, str(payload.url), payload.title, "webpage", payload.administrator_approved, payload.rights_status, payload.source_tier, request, session, user)


@router.post("/projects/{project_id}/sources/iiif", status_code=201)
async def iiif_source(project_id: UUID, payload: IIIFSourceCreate, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    return await _url_source(project_id, str(payload.manifest_url), "IIIF Manifest", "iiif_manifest", payload.administrator_approved, "unknown", "A", request, session, user)


@router.get("/sources/{source_id}")
async def get_source(source_id: UUID, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    source = await session.get(SourceRecord, source_id)
    if source is None:
        raise HTTPException(404, "Source not found")
    return row_dict(source)


@router.patch("/sources/{source_id}")
async def patch_source(source_id: UUID, payload: SourcePatch, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    source = await session.get(SourceRecord, source_id)
    if source is None:
        raise HTTPException(404, "Source not found")
    before = row_dict(source)
    changes = payload.model_dump(exclude_none=True)
    for key, value in changes.items():
        setattr(source, key, value)
    if source.public_display_allowed and not evaluate_rights(source.rights_status, source.attribution_text).may_display_original:
        raise HTTPException(409, "Rights status does not permit public original display")
    await record_audit(session, event_type="rights_or_source_updated", entity_type="source_record", entity_id=source.id, actor_id=user.id, request_id=request.state.request_id, before=before, after=payload.model_dump(exclude_none=True, mode="json"))
    await session.commit()
    return row_dict(source)


@router.post("/sources/{source_id}/process")
async def process_source(source_id: UUID, request: Request, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    source = await session.get(SourceRecord, source_id)
    if source is None:
        raise HTTPException(404, "Source not found")
    if source.original_url:
        job_type = "import_iiif" if source.source_type == "iiif_manifest" else "fetch_url"
        job = await enqueue_job(
            session,
            job_type,
            {
                "source_id": str(source.id),
                "url": source.original_url,
                "administrator_approved": user.role == "admin",
            },
            f"{job_type}:{source.id}:refetch:{request.state.request_id}",
        )
        event_type = "source_refetch_requested"
    else:
        latest = await session.scalar(select(SourceSnapshot).where(SourceSnapshot.source_id == source_id).order_by(SourceSnapshot.created_at.desc()))
        if latest is None:
            raise HTTPException(409, "Source has no snapshot to process")
        job = await enqueue_job(session, "ingest_source", {"source_id": str(source_id), "snapshot_id": str(latest.id)}, f"ingest:{latest.id}:reprocess:{source.updated_at.isoformat()}")
        event_type = "source_reprocess_requested"
    source.processing_status = "queued"
    await record_audit(session, event_type=event_type, entity_type="source_record", entity_id=source.id, actor_id=user.id, request_id=request.state.request_id, after={"job_id": str(job.id)})
    await session.commit()
    return row_dict(job)


@router.get("/sources/{source_id}/chunks")
async def source_chunks(source_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(SourceChunk).where(SourceChunk.source_id == source_id).order_by(SourceChunk.page_number, SourceChunk.chunk_index)))
    return [row_dict(item) for item in rows]


@router.get("/sources/{source_id}/snapshots")
async def source_snapshots(source_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(SourceSnapshot).where(SourceSnapshot.source_id == source_id).order_by(SourceSnapshot.created_at.desc())))
    return [row_dict(item) for item in rows]


@router.get("/sources/{source_id}/sensitive-flags")
async def source_flags(source_id: UUID, session: SessionDep, user: CurrentUser) -> list[dict[str, Any]]:
    del user
    rows = list(await session.scalars(select(SensitiveContentFlag).where(SensitiveContentFlag.source_id == source_id)))
    return [row_dict(item) for item in rows]
