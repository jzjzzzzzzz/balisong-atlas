import asyncio
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionFactory
from app.models.domain import (
    ArtifactRecord,
    Asset,
    Claim,
    ClaimEvidence,
    Contradiction,
    DesignFeature,
    DesignFeatureEvidence,
    ImageObservation,
    ReconstructionHypothesis,
    ReconstructionVersion,
    ResearchProject,
    SourceChunk,
    SourceRecord,
    SourceSnapshot,
)
from app.services.parsing.image_processor import image_metadata, perceptual_hash
from app.services.reconstruction.brief import (
    BilingualTitle,
    ExcludedInformation,
    HistoricalPeriod,
    ReconstructionBriefV1,
    SafetyConstraints,
    Uncertainty,
    VisualFeatureBrief,
)
from app.services.storage.factory import get_storage

ROOT = Path(__file__).parents[1]
FIX = ROOT / "data/fixtures"
SAFE = ROOT / "packages/safe-3d/fixtures"


async def put_snapshot(session, storage, source, path: Path, mime: str) -> SourceSnapshot:
    content = path.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    key = await storage.put(content, mime)
    source.content_sha256 = digest
    snapshot = SourceSnapshot(
        source_id=source.id, storage_key=key, mime_type=mime, file_size=len(content), sha256=digest,
        fetched_at=datetime.now(timezone.utc), response_headers_json={}, parser_version="seed-fixture-v1",
    )
    session.add(snapshot)
    await session.flush()
    return snapshot


async def seed() -> None:
    storage = get_storage()
    async with SessionFactory() as session:
        if not await session.scalar(select(ResearchProject).where(ResearchProject.slug == "between-two-handles")):
            session.add(ResearchProject(
                slug="between-two-handles",
                title="Between Two Handles: A Visual History of the Balisong",
                subtitle="双柄之间：蝴蝶刀的视觉设计史",
                description="An empty, evidence-first exhibition structure awaiting reviewed archival research.",
                primary_language="en", secondary_language="zh", status="draft", public_visibility=False,
            ))
        existing = await session.scalar(select(ResearchProject).where(ResearchProject.slug == "balisong-atlas-demo"))
        if existing:
            await session.commit()
            print("Seed already present; no records changed.")
            return
        project = ResearchProject(
            slug="balisong-atlas-demo", title="Balisong Atlas Demo Collection",
            subtitle="Evidence workflow fixture / 证据流程演示",
            description="A wholly fictional collection demonstrating citation, review, rights, contradiction, and safe-proxy workflows.",
            primary_language="en", secondary_language="zh", status="published", public_visibility=True,
        )
        session.add(project)
        await session.flush()
        artifact = ArtifactRecord(
            project_id=project.id, slug="fictional-kinetic-folding-artifact-a-01",
            preferred_name="Fictional Kinetic Folding Artifact A-01", alternative_names_json=["A-01 abstract study"],
            record_type="reconstruction_subject", institution_name="Balisong Atlas Fictional Fixture Lab",
            accession_reference="DEMO-A-01", approximate_date_text="Fictional study; no historical date",
            geographic_association_text="No real-world association", cultural_context="Created solely for software validation.",
            public_summary="A unitless abstract fixture used to demonstrate evidence review and nonfunctional museum visualization.",
            research_notes="This record does not describe a real object.", record_status="verified",
        )
        session.add(artifact)
        await session.flush()
        pdf_source = SourceRecord(
            project_id=project.id, source_type="pdf", title="Fictional A-01 research sheet", creator="Balisong Atlas fixture generator",
            institution="Balisong Atlas Fictional Fixture Lab", original_language="en", rights_status="public_domain",
            license_label="CC0 fixture", attribution_text="Balisong Atlas fictional fixture", source_tier="A",
            source_quality_score=0.9, processing_status="processed", public_display_allowed=True,
        )
        session.add(pdf_source)
        await session.flush()
        pdf_snapshot = await put_snapshot(session, storage, pdf_source, FIX / "fictional-research-sheet.pdf", "application/pdf")
        chunk_texts = [
            "This fictional source documents an abstract museum visualization fixture with two muted surface bands and a neutral central insert.",
            "A second caption disputes whether the ochre surface band belongs to the same fictional study.",
        ]
        chunks = []
        for index, text in enumerate(chunk_texts):
            chunk = SourceChunk(
                source_id=pdf_source.id, snapshot_id=pdf_snapshot.id, chunk_index=index, text=text,
                public_safe_text=text, page_number=1, section_title="Demo research note", start_offset=0,
                end_offset=len(text), bounding_box_json={"x0": 70, "y0": 60 + 20 * index, "x1": 520, "y1": 80 + 20 * index},
                language="en", token_count=len(text.split()), text_search_vector=text,
                contains_sensitive_content=False, excluded_from_ai=False, excluded_from_public_search=False,
            )
            session.add(chunk)
            chunks.append(chunk)
        await session.flush()
        image_sources = []
        image_assets = []
        for index, filename in enumerate(("abstract-study-a.png", "abstract-study-b.png"), start=1):
            source = SourceRecord(
                project_id=project.id, source_type="image", title=f"Abstract fixture study {index}",
                creator="Balisong Atlas fixture generator", institution="Balisong Atlas Fictional Fixture Lab",
                original_language="en", rights_status="public_domain", license_label="CC0 fixture",
                attribution_text="Balisong Atlas fictional fixture", source_tier="A", source_quality_score=0.9,
                processing_status="processed", public_display_allowed=True,
            )
            session.add(source)
            await session.flush()
            path = FIX / filename
            snapshot = await put_snapshot(session, storage, source, path, "image/png")
            content = path.read_bytes()
            width, height, _ = image_metadata(content)
            asset = Asset(
                project_id=project.id, source_id=source.id, artifact_id=artifact.id, asset_type="image",
                storage_key=snapshot.storage_key, original_filename=filename, mime_type="image/png", width=width,
                height=height, sha256=snapshot.sha256, perceptual_hash=perceptual_hash(content), rights_status="public_domain",
                attribution_text="Balisong Atlas fictional fixture", public_display_allowed=True, is_synthetic=False,
            )
            session.add(asset)
            image_sources.append(source)
            image_assets.append(asset)
        await session.flush()
        claims = [
            Claim(project_id=project.id, artifact_id=artifact.id, claim_type="visual_feature", statement="The saved fictional sheet describes two muted surface bands.", language="en", epistemic_status="accepted", confidence_score=0.86, confidence_label="high", proposed_by="human", reviewed_at=datetime.now(timezone.utc)),
            Claim(project_id=project.id, artifact_id=artifact.id, claim_type="visual_feature", statement="The saved fictional sheet identifies a neutral central insert in the abstract study.", language="en", epistemic_status="accepted", confidence_score=0.88, confidence_label="high", proposed_by="human", reviewed_at=datetime.now(timezone.utc)),
            Claim(project_id=project.id, artifact_id=artifact.id, claim_type="attribution", statement="The ochre surface band may belong to a separate fictional study.", language="en", epistemic_status="disputed", confidence_score=0.51, confidence_label="medium", proposed_by="human", reviewed_at=datetime.now(timezone.utc)),
        ]
        session.add_all(claims)
        await session.flush()
        for claim, chunk, relation in ((claims[0], chunks[0], "supports"), (claims[1], chunks[0], "supports"), (claims[2], chunks[1], "supports")):
            session.add(ClaimEvidence(
                claim_id=claim.id, source_id=pdf_source.id, source_chunk_id=chunk.id, relation=relation,
                short_excerpt=chunk.public_safe_text, page_number=1, section_title="Demo research note",
                bounding_box_json=chunk.bounding_box_json, evidence_directness=0.9, evidence_independence=0.8,
                reviewer_verified=True,
            ))
        contradiction = Contradiction(
            project_id=project.id, claim_a_id=claims[0].id, claim_b_id=claims[2].id,
            contradiction_type="partial", explanation="The fixture caption disputes whether one visible band belongs to the same abstract study.",
            detected_by="human", review_status="accepted", resolution_notes="Retained as an intentionally unresolved demo contradiction.",
        )
        session.add(contradiction)
        observations = [
            ImageObservation(asset_id=image_assets[0].id, artifact_id=artifact.id, observation_type="color_appearance", description="A muted ochre band is directly visible against a dark slate field.", normalized_bbox_json={"x": 0.05, "y": 0.32, "width": 0.9, "height": 0.36}, normalized_polygon_json=[], epistemic_state="observed", confidence=0.95, proposed_by="human", review_status="accepted"),
            ImageObservation(asset_id=image_assets[0].id, artifact_id=artifact.id, observation_type="silhouette", description="The abstract study has a continuous rounded outer contour.", normalized_bbox_json={"x": 0.1, "y": 0.2, "width": 0.8, "height": 0.6}, normalized_polygon_json=[], epistemic_state="observed", confidence=0.9, proposed_by="human", review_status="accepted"),
            ImageObservation(asset_id=image_assets[1].id, artifact_id=artifact.id, observation_type="surface_motif", description="Alternating circular fields are directly visible in the second abstract study.", normalized_bbox_json={"x": 0.15, "y": 0.15, "width": 0.7, "height": 0.7}, normalized_polygon_json=[], epistemic_state="observed", confidence=0.9, proposed_by="human", review_status="accepted"),
        ]
        session.add_all(observations)
        await session.flush()
        feature_specs = [
            ("Rounded continuous contour", "silhouette", "A rounded, unitless outer contour.", "observed", observations[1].id, None),
            ("Muted two-tone surface", "color_appearance", "Muted ochre and slate surface fields.", "observed", observations[0].id, claims[0].id),
            ("Circular field motif", "surface_motif", "Alternating circular surface fields.", "observed", observations[2].id, None),
            ("Neutral central field", "external_form", "An abstract neutral central insert presented without mechanical detail.", "inferred", None, claims[1].id),
        ]
        features = []
        for label, category, description, state, observation_id, claim_id in feature_specs:
            feature = DesignFeature(
                project_id=project.id, artifact_id=artifact.id, label=label, category=category,
                description=description, epistemic_state=state, confidence_score=0.88 if state == "observed" else 0.66,
                review_status="accepted", public_safe=True, excluded_from_geometry=False,
                reviewer_notes="Accepted for the fictional demo only.",
            )
            session.add(feature)
            await session.flush()
            session.add(DesignFeatureEvidence(
                design_feature_id=feature.id, claim_id=claim_id, image_observation_id=observation_id,
                evidence_weight=1.0, reviewer_verified=True,
            ))
            features.append(feature)
        hypothesis = ReconstructionHypothesis(
            project_id=project.id, artifact_id=artifact.id, title="A-01 abstract visual hypothesis",
            description="A nonfunctional, unitless visual proxy for testing evidence annotations.",
            historical_period_text="Fictional demo; no historical period", status="approved", confidence_score=0.78,
            human_rationale="Approved only as a software fixture.", generated_from_accepted_claims_only=True,
            approved_at=datetime.now(timezone.utc),
        )
        session.add(hypothesis)
        await session.flush()
        brief_features = []
        for feature, spec in zip(features, feature_specs, strict=True):
            observation_id, claim_id = spec[4], spec[5]
            brief_features.append(VisualFeatureBrief(
                feature_id=feature.id, category=feature.category, description=feature.description,
                epistemic_state=feature.epistemic_state, confidence=feature.confidence_score,
                evidence_claim_ids=[claim_id] if claim_id else [],
                evidence_observation_ids=[observation_id] if observation_id else [],
                include_in_public_proxy=True,
            ))
        brief = ReconstructionBriefV1(
            project_id=project.id, artifact_id=artifact.id, hypothesis_id=hypothesis.id,
            title=BilingualTitle(en="A-01 abstract visual hypothesis", zh="A-01 抽象视觉假设"),
            historical_period=HistoricalPeriod(label="Fictional demo; no historical period", confidence=1.0, evidence_ids=[claims[0].id]),
            visual_features=brief_features,
            uncertainties=[Uncertainty(description="The neutral central field is interpretive and visibly labelled inferred.", reason="unsupported_inference", related_feature_ids=[features[3].id])],
            excluded_information=[ExcludedInformation(category=item) for item in ("measurement", "mechanism", "manufacturing", "operation")],
            safety_constraints=SafetyConstraints(),
        )
        glb_path, preview_path = SAFE / "demo-abstract-proxy.glb", SAFE / "demo-preview.png"
        glb_key = await storage.put(glb_path.read_bytes(), "model/gltf-binary")
        preview_key = await storage.put(preview_path.read_bytes(), "image/png")
        glb_asset = Asset(
            project_id=project.id, artifact_id=artifact.id, asset_type="public_proxy", storage_key=glb_key,
            original_filename="demo-abstract-proxy.glb", mime_type="model/gltf-binary", sha256=hashlib.sha256(glb_path.read_bytes()).hexdigest(),
            rights_status="licensed", attribution_text="Balisong Atlas generated fixture", public_display_allowed=True,
            is_synthetic=True, synthetic_method="procedural abstract fixture", synthetic_label="AI-assisted interpretive visualization",
        )
        preview_asset = Asset(
            project_id=project.id, artifact_id=artifact.id, asset_type="model_preview", storage_key=preview_key,
            original_filename="demo-preview.png", mime_type="image/png", width=1200, height=800,
            sha256=hashlib.sha256(preview_path.read_bytes()).hexdigest(), rights_status="licensed",
            attribution_text="Balisong Atlas generated fixture", public_display_allowed=True, is_synthetic=True,
            synthetic_method="procedural abstract fixture", synthetic_label="AI-assisted interpretive visualization",
        )
        session.add_all([glb_asset, preview_asset])
        await session.flush()
        session.add(ReconstructionVersion(
            hypothesis_id=hypothesis.id, version_number=1, reconstruction_brief_json=brief.model_dump(mode="json"),
            brief_schema_version="1.0", public_proxy_glb_asset_id=glb_asset.id, preview_image_asset_id=preview_asset.id,
            renderer_version="fixture-generator-v1", source_claim_ids_json=[str(claim.id) for claim in claims[:2]],
            source_observation_ids_json=[str(item.id) for item in observations], is_nonfunctional=True,
            real_scale_removed=True, parts_joined=True, no_moving_parts=True, approved_for_public_display=True,
        ))
        await session.commit()
        print("Seeded draft exhibit and fictional demo collection.")


if __name__ == "__main__":
    asyncio.run(seed())
