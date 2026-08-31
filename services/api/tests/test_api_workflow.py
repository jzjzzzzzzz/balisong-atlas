import asyncio
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models.domain import User
from app.services.storage.object_storage import LocalObjectStorage
from worker.runners.ingestion import ingest_source_handler

ROOT = Path(__file__).parents[3]


def test_end_to_end_evidence_review_and_safe_proxy_job(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    storage = LocalObjectStorage(tmp_path / "objects")

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with factory() as session:
            session.add(User(email="admin@example.org", password_hash=hash_password("correct horse battery"), role="admin", is_active=True))
            await session.commit()

    async def override_session():  # type: ignore[no-untyped-def]
        async with factory() as session:
            yield session

    asyncio.run(setup())
    app.dependency_overrides[get_session] = override_session
    monkeypatch.setattr("app.api.routes.sources.get_storage", lambda: storage)
    monkeypatch.setattr("worker.runners.ingestion.get_storage", lambda: storage)

    def expect(response, status: int = 200) -> dict[str, Any]:  # type: ignore[no-untyped-def]
        assert response.status_code == status, response.text
        return response.json()

    with TestClient(app) as client:
        expect(client.post("/api/v1/auth/login", json={"email": "admin@example.org", "password": "correct horse battery"}))
        csrf = client.cookies.get("atlas_csrf")
        headers = {"x-csrf-token": csrf or ""}
        project = expect(client.post("/api/v1/projects", headers=headers, json={
            "slug": "integration-study", "title": "Integration Study", "description": "Safe test project",
            "primary_language": "en", "secondary_language": "zh",
        }), 201)
        project_id = project["id"]
        artifact = expect(client.post(f"/api/v1/projects/{project_id}/artifacts", headers=headers, json={
            "slug": "abstract-a-01", "preferred_name": "Abstract A-01", "record_type": "reconstruction_subject",
            "record_status": "verified",
        }), 201)
        artifact_id = artifact["id"]
        pdf_bytes = (ROOT / "data/fixtures/fictional-research-sheet.pdf").read_bytes()
        uploaded = expect(client.post(
            f"/api/v1/projects/{project_id}/sources/upload", headers=headers,
            data={"title": "Fixture PDF", "rights_status": "public_domain", "source_tier": "A", "attribution_text": "Fixture"},
            files={"file": ("fixture.pdf", pdf_bytes, "application/pdf")},
        ), 201)
        source_id = uploaded["source"]["id"]
        snapshot_id = uploaded["snapshot"]["id"]

        async def process() -> None:
            async with factory() as session:
                await ingest_source_handler(session, {"source_id": source_id, "snapshot_id": snapshot_id})
                await session.commit()

        asyncio.run(process())
        chunks = expect(client.get(f"/api/v1/sources/{source_id}/chunks"))
        assert chunks and chunks[0]["page_number"] == 1
        extraction = expect(client.post(
            f"/api/v1/projects/{project_id}/claims/extract", headers=headers,
            json={"source_id": source_id, "artifact_id": artifact_id, "chunk_ids": [chunks[0]["id"]]},
        ), 201)
        claim_id = extraction["claims"][0]["id"]
        claim = expect(client.get(f"/api/v1/claims/{claim_id}"))
        assert claim["epistemic_status"] == "proposed"
        assert claim["proposed_by"] == "ai"
        expect(client.post(f"/api/v1/claims/{claim_id}/evidence", headers=headers, json={
            "source_id": source_id, "source_chunk_id": chunks[0]["id"], "relation": "supports",
            "short_excerpt": chunks[0]["public_safe_text"][:200], "page_number": 1,
            "evidence_directness": 0.9, "evidence_independence": 0.8, "reviewer_verified": True,
        }), 201)
        accepted = expect(client.post(f"/api/v1/claims/{claim_id}/accept", headers=headers))
        assert accepted["epistemic_status"] == "accepted"

        image_bytes = (ROOT / "data/fixtures/abstract-study-a.png").read_bytes()
        image_upload = expect(client.post(
            f"/api/v1/projects/{project_id}/sources/upload", headers=headers,
            data={"title": "Fixture image", "rights_status": "public_domain", "source_tier": "A", "attribution_text": "Fixture"},
            files={"file": ("study.png", image_bytes, "image/png")},
        ), 201)
        image_source_id = image_upload["source"]["id"]
        assets = expect(client.get(f"/api/v1/projects/{project_id}/assets"))
        image_asset = next(item for item in assets if item["source_id"] == image_source_id)
        observation = expect(client.post(f"/api/v1/assets/{image_asset['id']}/observations", headers=headers, json={
            "artifact_id": artifact_id, "observation_type": "silhouette",
            "description": "A continuous rounded abstract contour is directly visible.",
            "normalized_bbox_json": {"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8},
            "normalized_polygon_json": [], "epistemic_state": "observed", "confidence": 0.9,
            "proposed_by": "human",
        }), 201)
        expect(client.post(f"/api/v1/observations/{observation['id']}/accept", headers=headers))
        feature = expect(client.post(f"/api/v1/artifacts/{artifact_id}/features", headers=headers, json={
            "label": "Rounded abstract contour", "category": "silhouette",
            "description": "A rounded abstract contour.", "epistemic_state": "observed",
            "confidence_score": 0.85, "evidence_claim_ids": [claim_id],
            "evidence_observation_ids": [observation["id"]],
        }), 201)
        expect(client.patch(f"/api/v1/features/{feature['id']}", headers=headers, json={"review_status": "accepted", "reviewer_notes": "Reviewed fixture"}))
        hypothesis = expect(client.post(f"/api/v1/artifacts/{artifact_id}/hypotheses", headers=headers, json={
            "title": "Abstract evidence hypothesis", "description": "Safe unitless fixture",
            "historical_period_text": "Unknown", "confidence_score": 0.4, "human_rationale": "Fixture only",
        }), 201)
        generated = expect(client.post(f"/api/v1/hypotheses/{hypothesis['id']}/generate-brief", headers=headers), 201)
        assert generated["validation_report"]["public_safety_validation_result"]["valid"]
        expect(client.post(f"/api/v1/hypotheses/{hypothesis['id']}/approve-brief", headers=headers))
        render = expect(client.post(f"/api/v1/hypotheses/{hypothesis['id']}/render-safe-proxy", headers=headers))
        assert render["job"]["job_type"] == "render_safe_proxy"
        assert render["capability"]["fixture_available"] is True
        graph = expect(client.get(f"/api/v1/projects/{project_id}/evidence-graph"))
        assert any(node["type"] == "claim" for node in graph["nodes"])
        timeline = expect(client.get(f"/api/v1/artifacts/{artifact_id}/timeline"))
        assert timeline == []  # accepted visual claims do not become chronology automatically
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())
