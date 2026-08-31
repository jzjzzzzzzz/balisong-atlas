import asyncio
import hashlib
import json
import tempfile
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Asset, ReconstructionHypothesis, ReconstructionVersion
from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import ReconstructionBriefV1
from app.services.storage.factory import get_storage
from worker.runners.ingestion import fetch_url_handler, import_iiif_handler, ingest_source_handler
from worker.runners.research import (
    calculate_hashes_handler,
    contradiction_handler,
    embeddings_handler,
    extract_entities_handler,
    image_phash_handler,
    ocr_handler,
    propose_claims_handler,
    propose_image_observations_handler,
    recalculate_confidence_handler,
    sensitive_content_handler,
    source_family_handler,
    source_stage_handler,
    timeline_handler,
    validate_brief_handler,
    validate_publication_handler,
)

Handler = Callable[[AsyncSession, dict[str, Any]], Awaitable[dict[str, Any]]]


async def render_safe_proxy_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    version_id = UUID(str(payload.get("version_id", "")))
    version = await session.get(ReconstructionVersion, version_id)
    if version is None:
        raise ValueError("Reconstruction version does not exist")
    hypothesis = await session.get(ReconstructionHypothesis, version.hypothesis_id)
    if hypothesis is None or hypothesis.status != "approved":
        raise ValueError("Reconstruction brief must be human-approved before rendering")
    backend = SafeProxyBackend()
    capability = backend.capability()
    if not capability["available"]:
        return {
            "status": "capability_unavailable",
            "reason": "BLENDER_BIN is not available",
            "fixture": "packages/safe-3d/fixtures/demo-abstract-proxy.glb",
        }
    brief = ReconstructionBriefV1.model_validate(version.reconstruction_brief_json)
    with tempfile.TemporaryDirectory(prefix="atlas-safe-proxy-") as temp:
        output = Path(temp)
        result = await asyncio.to_thread(backend.export_public_proxy, brief, output)
        if result.get("status") != "succeeded":
            raise RuntimeError(f"Safe proxy renderer failed: {result}")
        glb_path = output / "public_proxy.glb"
        preview_path = output / "preview.png"
        report_path = output / "generation_report.json"
        if not all(path.is_file() for path in (glb_path, preview_path, report_path)):
            raise RuntimeError("Safe proxy renderer did not produce the required output set")
        report = json.loads(report_path.read_text(encoding="utf-8"))
        confirmations = (
            report.get("joined_mesh_confirmation"),
            report.get("real_scale_removed_confirmation"),
            report.get("no_moving_parts_confirmation"),
            report.get("neutral_insert_confirmation"),
        )
        if not all(confirmations):
            raise RuntimeError("Generated output failed a mandatory safe-proxy confirmation")
        storage = get_storage()
        records: list[tuple[Path, str, str]] = [
            (glb_path, "model/gltf-binary", "public_proxy"),
            (preview_path, "image/png", "model_preview"),
            (report_path, "application/json", "document"),
        ]
        assets: list[Asset] = []
        for path, mime, asset_type in records:
            content = path.read_bytes()
            asset = Asset(
                project_id=hypothesis.project_id,
                artifact_id=hypothesis.artifact_id,
                asset_type=asset_type,
                storage_key=await storage.put(content, mime),
                original_filename=path.name,
                mime_type=mime,
                width=1200 if asset_type == "model_preview" else None,
                height=800 if asset_type == "model_preview" else None,
                sha256=hashlib.sha256(content).hexdigest(),
                rights_status="licensed",
                attribution_text="Balisong Atlas safe proxy renderer",
                public_display_allowed=asset_type != "document",
                is_synthetic=True,
                synthetic_method=backend.renderer_version,
                synthetic_label="AI-assisted interpretive visualization",
            )
            session.add(asset)
            assets.append(asset)
        await session.flush()
        version.public_proxy_glb_asset_id = assets[0].id
        version.preview_image_asset_id = assets[1].id
        version.generation_log_asset_id = assets[2].id
        version.renderer_version = backend.renderer_version
        version.approved_for_public_display = True
        return {
            "status": "succeeded",
            "version_id": str(version.id),
            "asset_ids": [str(asset.id) for asset in assets],
            "report": report,
        }


HANDLERS: dict[str, Handler] = {
    "ingest_source": ingest_source_handler,
    "fetch_url": fetch_url_handler,
    "import_iiif": import_iiif_handler,
    "parse_pdf": source_stage_handler,
    "parse_html": source_stage_handler,
    "extract_images": source_stage_handler,
    "create_chunks": source_stage_handler,
    "detect_sensitive_content": sensitive_content_handler,
    "redact_public_text": sensitive_content_handler,
    "calculate_hashes": calculate_hashes_handler,
    "calculate_image_phash": image_phash_handler,
    "run_ocr": ocr_handler,
    "generate_embeddings": embeddings_handler,
    "extract_entities": extract_entities_handler,
    "propose_claims": propose_claims_handler,
    "propose_image_observations": propose_image_observations_handler,
    "detect_source_families": source_family_handler,
    "detect_contradictions": contradiction_handler,
    "recalculate_confidence": recalculate_confidence_handler,
    "generate_timeline": timeline_handler,
    "validate_reconstruction_brief": validate_brief_handler,
    "validate_publication": validate_publication_handler,
    "render_safe_proxy": render_safe_proxy_handler,
}


async def generate_brief_job_handler(
    session: AsyncSession, payload: dict[str, Any]
) -> dict[str, Any]:
    hypothesis_id = UUID(str(payload.get("hypothesis_id", "")))
    hypothesis = await session.get(ReconstructionHypothesis, hypothesis_id)
    if hypothesis is None:
        raise ValueError("Reconstruction hypothesis does not exist")
    from app.services.reconstruction.generator import generate_reconstruction_version

    version, report = await generate_reconstruction_version(session, hypothesis)
    return {"status": "generated", "version_id": str(version.id), "report": report}


HANDLERS["generate_reconstruction_brief"] = generate_brief_job_handler


def get_handler(job_type: str) -> Handler:
    handler = HANDLERS.get(job_type)
    if handler is None:
        raise ValueError(f"Unknown job type: {job_type}")
    return handler
