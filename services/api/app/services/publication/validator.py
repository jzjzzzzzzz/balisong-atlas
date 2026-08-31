import re
from dataclasses import dataclass, field
from typing import Any

from app.services.ingestion.sensitive import detect_sensitive_content
from app.services.rights.rights_gate import evaluate_rights


@dataclass(frozen=True)
class PublicationBlocker:
    code: str
    message: str
    entity_type: str
    entity_id: str
    path: str


@dataclass
class PublicationInput:
    sources: list[dict[str, Any]] = field(default_factory=list)
    assets: list[dict[str, Any]] = field(default_factory=list)
    claims: list[dict[str, Any]] = field(default_factory=list)
    features: list[dict[str, Any]] = field(default_factory=list)
    reconstructions: list[dict[str, Any]] = field(default_factory=list)
    chunks: list[dict[str, Any]] = field(default_factory=list)


def validate_publication(data: PublicationInput) -> list[PublicationBlocker]:
    blockers: list[PublicationBlocker] = []
    for source in data.sources:
        sid = str(source.get("id", ""))
        decision = evaluate_rights(str(source.get("rights_status", "unknown")), str(source.get("attribution_text", "")))
        if source.get("public_display_allowed") and not decision.may_display_original:
            blockers.append(PublicationBlocker("rights_gate", "Source original is not cleared for public display.", "source", sid, f"/admin/sources/{sid}"))
        if source.get("public_display_allowed") and not source.get("attribution_text"):
            blockers.append(PublicationBlocker("missing_attribution", "Public source lacks attribution.", "source", sid, f"/admin/sources/{sid}"))
    for asset in data.assets:
        aid = str(asset.get("id", ""))
        if asset.get("public_display_allowed") and asset.get("rights_status") in {"unknown", "restricted", "metadata_only"}:
            blockers.append(PublicationBlocker("asset_rights", "Asset rights do not allow original display.", "asset", aid, f"/admin/assets/{aid}"))
        if asset.get("is_synthetic") and not asset.get("synthetic_label"):
            blockers.append(PublicationBlocker("synthetic_unlabelled", "Synthetic visual lacks the required label.", "asset", aid, f"/admin/assets/{aid}"))
    for claim in data.claims:
        cid = str(claim.get("id", ""))
        if claim.get("epistemic_status") == "accepted" and not claim.get("evidence_count"):
            blockers.append(PublicationBlocker("claim_without_evidence", "Accepted claim has no verified evidence.", "claim", cid, f"/admin/claims/{cid}"))
        if claim.get("epistemic_status") == "proposed" and claim.get("public"):
            blockers.append(PublicationBlocker("unreviewed_claim", "Proposed claim cannot be public.", "claim", cid, f"/admin/claims/{cid}"))
        if detect_sensitive_content(str(claim.get("statement", ""))):
            blockers.append(PublicationBlocker("controlled_content", "Claim contains controlled content.", "claim", cid, f"/admin/claims/{cid}"))
        excerpt = str(claim.get("short_excerpt", ""))
        if len(re.findall(r"\S+", excerpt)) > 80:
            blockers.append(PublicationBlocker("excerpt_too_long", "Public evidence excerpt is too long.", "claim", cid, f"/admin/claims/{cid}"))
    for feature in data.features:
        fid = str(feature.get("id", ""))
        if feature.get("epistemic_state") == "inferred" and feature.get("review_status") != "accepted":
            blockers.append(PublicationBlocker("unreviewed_inference", "Inferred feature requires human acceptance.", "feature", fid, f"/admin/features/{fid}"))
        if feature.get("epistemic_state") != "observed" and not feature.get("uncertainty_label"):
            blockers.append(PublicationBlocker("missing_uncertainty", "Interpretive feature lacks uncertainty labeling.", "feature", fid, f"/admin/features/{fid}"))
    for reconstruction in data.reconstructions:
        rid = str(reconstruction.get("id", ""))
        if not reconstruction.get("approved_for_public_display"):
            blockers.append(PublicationBlocker("reconstruction_unapproved", "Reconstruction has not been approved.", "reconstruction", rid, f"/admin/reconstructions/{rid}"))
    for chunk in data.chunks:
        chunk_id = str(chunk.get("id", ""))
        if not chunk.get("excluded_from_public_search") and detect_sensitive_content(
            str(chunk.get("public_safe_text", ""))
        ):
            blockers.append(
                PublicationBlocker(
                    "public_text_leak",
                    "Public-safe source text still contains controlled content.",
                    "source_chunk",
                    chunk_id,
                    f"/admin/source-chunks/{chunk_id}",
                )
            )
    return blockers
