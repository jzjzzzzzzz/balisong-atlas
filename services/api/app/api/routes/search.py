import hashlib
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select

from app.ai.guardrails.qa_policy import evaluate_question, insufficient_evidence
from app.ai.providers.factory import get_ai_provider
from app.core.config import get_settings
from app.core.dependencies import CurrentUser, SessionDep
from app.models.domain import Claim, ClaimEvidence, ModelRun, SourceChunk, SourceRecord
from app.schemas.domain import AskRequest
from app.services.ingestion.sensitive import contains_blocked_content
from app.services.search.hybrid import reciprocal_rank_fusion

router = APIRouter(tags=["search and QA"])


async def search_chunks(session: SessionDep, project_id: UUID, query: str, public_only: bool = False) -> list[dict[str, Any]]:
    text_condition = or_(
        SourceChunk.public_safe_text.ilike(f"%{query}%"),
        SourceChunk.section_title.ilike(f"%{query}%"),
    )
    if session.bind and session.bind.dialect.name == "postgresql":
        text_condition = func.to_tsvector(
            "simple", SourceChunk.public_safe_text
        ).op("@@")(func.plainto_tsquery("simple", query))
    statement = (
        select(SourceChunk, SourceRecord)
        .join(SourceRecord, SourceChunk.source_id == SourceRecord.id)
        .where(SourceRecord.project_id == project_id)
        .where(text_condition)
        .limit(40)
    )
    if public_only:
        statement = statement.where(
            SourceChunk.excluded_from_public_search.is_(False),
            SourceRecord.rights_status.notin_(["restricted"]),
        )
    rows = (await session.execute(statement)).all()
    lexical = [{
        "id": str(chunk.id), "source_id": str(source.id), "source_name": source.title,
        "source_type": source.source_type, "page_number": chunk.page_number,
        "section": chunk.section_title, "excerpt": chunk.public_safe_text[:420],
        "source_tier": source.source_tier, "rights": source.rights_status,
        "ocr_generated": chunk.ocr_generated, "sensitive_redaction": chunk.contains_sensitive_content,
        "public_evidence": not chunk.excluded_from_public_search and source.rights_status != "restricted",
    } for chunk, source in rows]
    semantic: list[dict[str, Any]] = []
    settings = get_settings()
    if (
        settings.embedding_enabled
        and not contains_blocked_content(query)
        and session.bind
        and session.bind.dialect.name == "postgresql"
    ):
        run = ModelRun(
            run_type="search_query_embedding",
            provider="mock" if settings.ai_mode == "mock" else "openai-compatible",
            model=settings.embedding_model or "mock-embedding-v1",
            prompt_version="embedding-v1",
            temperature=0,
            input_hash=hashlib.sha256(query.encode()).hexdigest(),
            input_summary="One search query; content omitted",
            output_json={},
            validation_status="running",
            started_at=datetime.now(timezone.utc),
        )
        session.add(run)
        await session.flush()
        try:
            vectors = await get_ai_provider().embed_text([query])
        except Exception as exc:
            run.validation_status = "failed"
            run.error_message = f"{type(exc).__name__}: embedding request failed"
            run.completed_at = datetime.now(timezone.utc)
            await session.commit()
            raise
        run.output_json = {
            "vector_count": len(vectors),
            "dimensions": len(vectors[0]) if vectors else 0,
        }
        dimension_valid = bool(vectors and len(vectors[0]) == settings.embedding_dim)
        run.validation_status = "valid" if dimension_valid else "failed_dimension_validation"
        run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        if dimension_valid:
            distance = SourceChunk.embedding.cosine_distance(vectors[0]).label("distance")
            semantic_statement = (
                select(SourceChunk, SourceRecord, distance)
                .join(SourceRecord, SourceChunk.source_id == SourceRecord.id)
                .where(
                    SourceRecord.project_id == project_id,
                    SourceChunk.embedding.is_not(None),
                    SourceChunk.excluded_from_ai.is_(False),
                )
                .order_by(distance)
                .limit(40)
            )
            if public_only:
                semantic_statement = semantic_statement.where(
                    SourceChunk.excluded_from_public_search.is_(False),
                    SourceRecord.rights_status.notin_(["restricted"]),
                )
            semantic_rows = (await session.execute(semantic_statement)).all()
            semantic = [{
                "id": str(chunk.id), "source_id": str(source.id), "source_name": source.title,
                "source_type": source.source_type, "page_number": chunk.page_number,
                "section": chunk.section_title, "excerpt": chunk.public_safe_text[:420],
                "source_tier": source.source_tier, "rights": source.rights_status,
                "ocr_generated": chunk.ocr_generated, "sensitive_redaction": chunk.contains_sensitive_content,
                "public_evidence": not chunk.excluded_from_public_search and source.rights_status != "restricted",
                "semantic_distance": round(float(row_distance), 6),
            } for chunk, source, row_distance in semantic_rows]
    fused = reciprocal_rank_fusion(
        {"full_text": lexical, "semantic": semantic}, key=lambda item: item["id"]
    )
    return [{**result.item, "relevance_score": result.score, "rank_channels": result.ranks} for result in fused]


@router.get("/projects/{project_id}/search")
async def search(project_id: UUID, session: SessionDep, user: CurrentUser, q: str = Query(min_length=2, max_length=300)) -> list[dict[str, Any]]:
    del user
    return await search_chunks(session, project_id, q)


@router.post("/projects/{project_id}/ask")
async def ask(project_id: UUID, payload: AskRequest, session: SessionDep, user: CurrentUser) -> dict[str, Any]:
    del user
    return await answer_from_reviewed_corpus(session, project_id, payload)


async def answer_from_reviewed_corpus(session: SessionDep, project_id: UUID, payload: AskRequest) -> dict[str, Any]:
    decision = evaluate_question(payload.question, payload.language)
    if not decision.allowed:
        return {"answered": False, "blocked": True, "category": decision.category, "answer": decision.response, "suggested_topics": decision.suggested_topics, "citations": []}
    terms = [term for term in payload.question.replace("?", " ").split() if len(term) > 2][:5]
    if not terms:
        return {"answered": False, "blocked": False, "answer": insufficient_evidence(payload.language), "citations": []}
    claim_query = select(Claim).where(Claim.project_id == project_id, Claim.epistemic_status == "accepted")
    claim_query = claim_query.where(or_(*[Claim.statement.ilike(f"%{term}%") for term in terms]))
    claims = list(await session.scalars(claim_query.limit(6)))
    citations: list[dict[str, Any]] = []
    statements: list[str] = []
    for claim in claims:
        evidence = list(await session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id, ClaimEvidence.reviewer_verified.is_(True))))
        if not evidence:
            continue
        statements.append(claim.statement)
        for item in evidence:
            source = await session.get(SourceRecord, item.source_id)
            if source and source.rights_status != "restricted":
                citations.append({"claim_id": str(claim.id), "source_id": str(source.id), "source_title": source.title, "page_number": item.page_number, "section": item.section_title, "excerpt": item.short_excerpt, "original_url": source.original_url, "rights": source.rights_status})
    if not statements or not citations:
        return {"answered": False, "blocked": False, "answer": insufficient_evidence(payload.language), "citations": []}
    return {"answered": True, "blocked": False, "answer": " ".join(statements), "citations": citations, "method": "accepted claims with reviewer-verified evidence only"}
