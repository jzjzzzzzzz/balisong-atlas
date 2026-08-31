from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.routes.search import answer_from_reviewed_corpus
from app.api.utils import row_dict
from app.core.dependencies import SessionDep
from app.models.domain import (
    ArtifactRecord,
    Asset,
    Claim,
    ClaimEvidence,
    ReconstructionHypothesis,
    ReconstructionVersion,
    ResearchProject,
    SourceRecord,
)
from app.schemas.domain import AskRequest
from app.services.rights.rights_gate import evaluate_rights

router = APIRouter(prefix="/public/exhibits", tags=["public exhibits"])


async def public_project(session: SessionDep, slug: str) -> ResearchProject:
    project = await session.scalar(select(ResearchProject).where(ResearchProject.slug == slug, ResearchProject.status == "published", ResearchProject.public_visibility.is_(True)))
    if project is None:
        raise HTTPException(404, "Published exhibit not found")
    return project


@router.get("/{slug}")
async def exhibit(slug: str, session: SessionDep) -> dict[str, Any]:
    project = await public_project(session, slug)
    return {
        **row_dict(project),
        "brand": "Balisong Atlas",
        "brand_zh": "Balisong Atlas｜蝴蝶刀设计史数字图谱",
        "tagline": "Every reconstruction should reveal its evidence.",
        "tagline_zh": "每一次重建，都应当展示它的证据。",
        "reconstruction_notice": "This reconstruction is a nonfunctional, evidence-based visual hypothesis. It is not a manufacturing model or an exact historical replica.",
        "reconstruction_notice_zh": "本重建是一个非功能性、以证据为基础的视觉假设，不是制造模型，也不是被宣称为完全准确的历史复制品。",
    }


@router.get("/{slug}/timeline")
async def timeline(slug: str, session: SessionDep) -> list[dict[str, Any]]:
    project = await public_project(session, slug)
    claims = list(await session.scalars(select(Claim).where(
        Claim.project_id == project.id, Claim.epistemic_status == "accepted",
        Claim.claim_type.in_(["chronology", "design_change", "production", "media_representation"]),
    )))
    output: list[dict[str, Any]] = []
    for claim in claims:
        evidence = await session.scalar(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id, ClaimEvidence.reviewer_verified.is_(True)))
        if evidence:
            source = await session.get(SourceRecord, evidence.source_id)
            output.append({"id": claim.id, "statement": claim.statement, "confidence": claim.confidence_score, "uncertainty": claim.confidence_label, "source": source.title if source else "", "source_id": evidence.source_id, "page_number": evidence.page_number, "section": evidence.section_title})
    return output


@router.get("/{slug}/artifacts")
async def artifacts(slug: str, session: SessionDep) -> list[dict[str, Any]]:
    project = await public_project(session, slug)
    rows = list(await session.scalars(select(ArtifactRecord).where(ArtifactRecord.project_id == project.id, ArtifactRecord.record_status.notin_(["proposed", "archived"]))))
    return [{key: value for key, value in row_dict(item).items() if key != "research_notes"} for item in rows]


@router.get("/{slug}/sources")
async def sources(slug: str, session: SessionDep) -> list[dict[str, Any]]:
    project = await public_project(session, slug)
    rows = list(await session.scalars(select(SourceRecord).where(SourceRecord.project_id == project.id, SourceRecord.rights_status != "restricted")))
    output = []
    for source in rows:
        decision = evaluate_rights(source.rights_status, source.attribution_text)
        output.append({
            "id": source.id, "title": source.title, "creator": source.creator,
            "institution": source.institution, "source_type": source.source_type,
            "source_tier": source.source_tier, "rights_status": source.rights_status,
            "rights_uri": source.rights_uri, "attribution_text": source.attribution_text,
            "original_url": source.original_url, "original_display": decision.may_display_original,
            "metadata_only": decision.metadata_only,
        })
    return output


@router.get("/{slug}/reconstructions")
async def reconstructions(slug: str, session: SessionDep) -> list[dict[str, Any]]:
    project = await public_project(session, slug)
    hypotheses = list(await session.scalars(select(ReconstructionHypothesis).where(ReconstructionHypothesis.project_id == project.id, ReconstructionHypothesis.status == "approved")))
    output: list[dict[str, Any]] = []
    for hypothesis in hypotheses:
        versions = list(await session.scalars(select(ReconstructionVersion).where(ReconstructionVersion.hypothesis_id == hypothesis.id, ReconstructionVersion.approved_for_public_display.is_(True))))
        for version in versions:
            proxy = await session.get(Asset, version.public_proxy_glb_asset_id) if version.public_proxy_glb_asset_id else None
            preview = await session.get(Asset, version.preview_image_asset_id) if version.preview_image_asset_id else None
            output.append({
                "id": version.id, "title": hypothesis.title, "description": hypothesis.description,
                "version_number": version.version_number, "brief": version.reconstruction_brief_json,
                "public_proxy_url": f"/api/v1/public/assets/{proxy.id}" if proxy and proxy.public_display_allowed else None,
                "preview_image_url": f"/api/v1/public/assets/{preview.id}" if preview and preview.public_display_allowed else None,
                "synthetic_label": proxy.synthetic_label if proxy else None,
                "viewer_capabilities": {"rotate_scene": True, "limited_zoom": True, "background_toggle": True, "evidence_annotations": True, "download": False, "measurement": False, "section": False, "exploded_view": False, "part_visibility": False, "joint_control": False, "animation": False, "export": False, "real_units": False},
            })
    return output


@router.post("/{slug}/ask")
async def ask(slug: str, payload: AskRequest, session: SessionDep) -> dict[str, Any]:
    project = await public_project(session, slug)
    return await answer_from_reviewed_corpus(session, project.id, payload)
