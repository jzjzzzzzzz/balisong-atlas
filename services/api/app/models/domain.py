from datetime import datetime
from typing import Any
from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDTimestampMixin

JsonObject = dict[str, Any]
JsonList = list[Any]


class User(UUIDTimestampMixin, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(32), default="researcher")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    __table_args__ = (CheckConstraint("role IN ('admin','researcher','reviewer')"),)


class ResearchProject(UUIDTimestampMixin, Base):
    __tablename__ = "research_projects"
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    subtitle: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    primary_language: Mapped[str] = mapped_column(String(16), default="en")
    secondary_language: Mapped[str] = mapped_column(String(16), default="zh")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    public_visibility: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class ArtifactRecord(UUIDTimestampMixin, Base):
    __tablename__ = "artifact_records"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    slug: Mapped[str] = mapped_column(String(160))
    preferred_name: Mapped[str] = mapped_column(String(500))
    alternative_names_json: Mapped[JsonList] = mapped_column(JSON, default=list)
    record_type: Mapped[str] = mapped_column(String(48))
    institution_name: Mapped[str] = mapped_column(String(500), default="")
    accession_reference: Mapped[str] = mapped_column(String(250), default="")
    approximate_date_text: Mapped[str] = mapped_column(String(250), default="")
    geographic_association_text: Mapped[str] = mapped_column(String(500), default="")
    cultural_context: Mapped[str] = mapped_column(Text, default="")
    public_summary: Mapped[str] = mapped_column(Text, default="")
    research_notes: Mapped[str] = mapped_column(Text, default="")
    record_status: Mapped[str] = mapped_column(String(32), default="proposed")
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    __table_args__ = (UniqueConstraint("project_id", "slug"),)


class SourceRecord(UUIDTimestampMixin, Base):
    __tablename__ = "source_records"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(700))
    creator: Mapped[str] = mapped_column(String(500), default="")
    institution: Mapped[str] = mapped_column(String(500), default="")
    publisher: Mapped[str] = mapped_column(String(500), default="")
    original_url: Mapped[str] = mapped_column(Text, default="")
    canonical_url: Mapped[str] = mapped_column(Text, default="")
    publication_date_text: Mapped[str] = mapped_column(String(250), default="")
    accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    original_language: Mapped[str] = mapped_column(String(24), default="")
    rights_status: Mapped[str] = mapped_column(String(32), default="unknown")
    rights_uri: Mapped[str] = mapped_column(Text, default="")
    license_label: Mapped[str] = mapped_column(String(250), default="")
    attribution_text: Mapped[str] = mapped_column(Text, default="")
    source_tier: Mapped[str] = mapped_column(String(1), default="D")
    source_quality_score: Mapped[float] = mapped_column(Float, default=0.25)
    content_sha256: Mapped[str] = mapped_column(String(64), default="", index=True)
    processing_status: Mapped[str] = mapped_column(String(32), default="pending")
    public_display_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    contains_sensitive_measurements: Mapped[bool] = mapped_column(Boolean, default=False)
    contains_operational_content: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class SourceSnapshot(UUIDTimestampMixin, Base):
    __tablename__ = "source_snapshots"
    source_id: Mapped[UUID] = mapped_column(ForeignKey("source_records.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String(180))
    mime_type: Mapped[str] = mapped_column(String(160))
    file_size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_headers_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    parser_version: Mapped[str] = mapped_column(String(80), default="ingest-v1")


class SourceChunk(UUIDTimestampMixin, Base):
    __tablename__ = "source_chunks"
    source_id: Mapped[UUID] = mapped_column(ForeignKey("source_records.id"), index=True)
    snapshot_id: Mapped[UUID] = mapped_column(ForeignKey("source_snapshots.id"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    public_safe_text: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_title: Mapped[str] = mapped_column(String(500), default="")
    start_offset: Mapped[int] = mapped_column(Integer, default=0)
    end_offset: Mapped[int] = mapped_column(Integer, default=0)
    bounding_box_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    language: Mapped[str] = mapped_column(String(24), default="")
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    text_search_vector: Mapped[str] = mapped_column(Text, default="")
    embedding: Mapped[list[float] | None] = mapped_column(Vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(160), nullable=True)
    contains_sensitive_content: Mapped[bool] = mapped_column(Boolean, default=False)
    excluded_from_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    excluded_from_public_search: Mapped[bool] = mapped_column(Boolean, default=False)
    ocr_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    __table_args__ = (UniqueConstraint("snapshot_id", "chunk_index"),)


class ArtifactSourceLink(UUIDTimestampMixin, Base):
    __tablename__ = "artifact_source_links"
    artifact_id: Mapped[UUID] = mapped_column(ForeignKey("artifact_records.id"))
    source_id: Mapped[UUID] = mapped_column(ForeignKey("source_records.id"))
    relation: Mapped[str] = mapped_column(String(32))
    reviewer_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (UniqueConstraint("artifact_id", "source_id", "relation"),)


class Asset(UUIDTimestampMixin, Base):
    __tablename__ = "assets"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    source_id: Mapped[UUID | None] = mapped_column(ForeignKey("source_records.id"), nullable=True)
    artifact_id: Mapped[UUID | None] = mapped_column(ForeignKey("artifact_records.id"), nullable=True)
    asset_type: Mapped[str] = mapped_column(String(40))
    storage_key: Mapped[str] = mapped_column(String(180))
    original_filename: Mapped[str] = mapped_column(String(500), default="")
    mime_type: Mapped[str] = mapped_column(String(160))
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    perceptual_hash: Mapped[str] = mapped_column(String(64), default="")
    rights_status: Mapped[str] = mapped_column(String(32), default="unknown")
    attribution_text: Mapped[str] = mapped_column(Text, default="")
    public_display_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False)
    synthetic_method: Mapped[str] = mapped_column(String(160), default="")
    synthetic_label: Mapped[str] = mapped_column(String(300), default="")


class SensitiveContentFlag(UUIDTimestampMixin, Base):
    __tablename__ = "sensitive_content_flags"
    source_id: Mapped[UUID] = mapped_column(ForeignKey("source_records.id"), index=True)
    source_chunk_id: Mapped[UUID | None] = mapped_column(ForeignKey("source_chunks.id"), nullable=True)
    asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(48))
    detection_method: Mapped[str] = mapped_column(String(24))
    confidence: Mapped[float] = mapped_column(Float)
    action: Mapped[str] = mapped_column(String(48))
    reviewer_status: Mapped[str] = mapped_column(String(32), default="proposed")
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")


class ImageObservation(UUIDTimestampMixin, Base):
    __tablename__ = "image_observations"
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("assets.id"), index=True)
    artifact_id: Mapped[UUID | None] = mapped_column(ForeignKey("artifact_records.id"), nullable=True)
    observation_type: Mapped[str] = mapped_column(String(48))
    description: Mapped[str] = mapped_column(Text)
    normalized_bbox_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    normalized_polygon_json: Mapped[JsonList] = mapped_column(JSON, default=list)
    epistemic_state: Mapped[str] = mapped_column(String(24))
    confidence: Mapped[float] = mapped_column(Float)
    proposed_by: Mapped[str] = mapped_column(String(16), default="human")
    review_status: Mapped[str] = mapped_column(String(24), default="proposed")
    reviewer_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")


class Entity(UUIDTimestampMixin, Base):
    __tablename__ = "entities"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    entity_type: Mapped[str] = mapped_column(String(40))
    preferred_label_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    alternative_labels_json: Mapped[JsonList] = mapped_column(JSON, default=list)
    description: Mapped[str] = mapped_column(Text, default="")
    external_identifier_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    review_status: Mapped[str] = mapped_column(String(24), default="proposed")


class EntityRelation(UUIDTimestampMixin, Base):
    __tablename__ = "entity_relations"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    subject_entity_id: Mapped[UUID] = mapped_column(ForeignKey("entities.id"))
    predicate: Mapped[str] = mapped_column(String(160))
    object_entity_id: Mapped[UUID] = mapped_column(ForeignKey("entities.id"))
    start_date_text: Mapped[str] = mapped_column(String(250), default="")
    end_date_text: Mapped[str] = mapped_column(String(250), default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    review_status: Mapped[str] = mapped_column(String(24), default="proposed")
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)


class Claim(UUIDTimestampMixin, Base):
    __tablename__ = "claims"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    artifact_id: Mapped[UUID | None] = mapped_column(ForeignKey("artifact_records.id"), nullable=True)
    claim_type: Mapped[str] = mapped_column(String(48))
    statement: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(24), default="en")
    epistemic_status: Mapped[str] = mapped_column(String(32), default="proposed")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_label: Mapped[str] = mapped_column(String(16), default="low")
    proposed_by: Mapped[str] = mapped_column(String(16), default="human")
    model_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("model_runs.id"), nullable=True)
    reviewer_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ClaimEvidence(UUIDTimestampMixin, Base):
    __tablename__ = "claim_evidence"
    claim_id: Mapped[UUID] = mapped_column(ForeignKey("claims.id"), index=True)
    source_id: Mapped[UUID] = mapped_column(ForeignKey("source_records.id"))
    source_chunk_id: Mapped[UUID | None] = mapped_column(ForeignKey("source_chunks.id"), nullable=True)
    asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    image_observation_id: Mapped[UUID | None] = mapped_column(ForeignKey("image_observations.id"), nullable=True)
    relation: Mapped[str] = mapped_column(String(24))
    short_excerpt: Mapped[str] = mapped_column(String(500), default="")
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_title: Mapped[str] = mapped_column(String(500), default="")
    bounding_box_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    evidence_directness: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_independence: Mapped[float] = mapped_column(Float, default=0.0)
    reviewer_verified: Mapped[bool] = mapped_column(Boolean, default=False)


class Contradiction(UUIDTimestampMixin, Base):
    __tablename__ = "contradictions"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    claim_a_id: Mapped[UUID] = mapped_column(ForeignKey("claims.id"))
    claim_b_id: Mapped[UUID] = mapped_column(ForeignKey("claims.id"))
    contradiction_type: Mapped[str] = mapped_column(String(32))
    explanation: Mapped[str] = mapped_column(Text)
    detected_by: Mapped[str] = mapped_column(String(16))
    review_status: Mapped[str] = mapped_column(String(24), default="proposed")
    reviewer_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    resolution_notes: Mapped[str] = mapped_column(Text, default="")


class DesignFeature(UUIDTimestampMixin, Base):
    __tablename__ = "design_features"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    artifact_id: Mapped[UUID] = mapped_column(ForeignKey("artifact_records.id"), index=True)
    label: Mapped[str] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(48))
    description: Mapped[str] = mapped_column(Text)
    epistemic_state: Mapped[str] = mapped_column(String(24))
    confidence_score: Mapped[float] = mapped_column(Float)
    review_status: Mapped[str] = mapped_column(String(24), default="proposed")
    public_safe: Mapped[bool] = mapped_column(Boolean, default=True)
    excluded_from_geometry: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewer_notes: Mapped[str] = mapped_column(Text, default="")


class DesignFeatureEvidence(UUIDTimestampMixin, Base):
    __tablename__ = "design_feature_evidence"
    design_feature_id: Mapped[UUID] = mapped_column(ForeignKey("design_features.id"), index=True)
    claim_id: Mapped[UUID | None] = mapped_column(ForeignKey("claims.id"), nullable=True)
    image_observation_id: Mapped[UUID | None] = mapped_column(ForeignKey("image_observations.id"), nullable=True)
    evidence_weight: Mapped[float] = mapped_column(Float)
    reviewer_verified: Mapped[bool] = mapped_column(Boolean, default=False)


class ReconstructionHypothesis(UUIDTimestampMixin, Base):
    __tablename__ = "reconstruction_hypotheses"
    project_id: Mapped[UUID] = mapped_column(ForeignKey("research_projects.id"), index=True)
    artifact_id: Mapped[UUID] = mapped_column(ForeignKey("artifact_records.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    historical_period_text: Mapped[str] = mapped_column(String(250), default="")
    status: Mapped[str] = mapped_column(String(24), default="draft")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    human_rationale: Mapped[str] = mapped_column(Text, default="")
    generated_from_accepted_claims_only: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ReconstructionVersion(UUIDTimestampMixin, Base):
    __tablename__ = "reconstruction_versions"
    hypothesis_id: Mapped[UUID] = mapped_column(ForeignKey("reconstruction_hypotheses.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    reconstruction_brief_json: Mapped[JsonObject] = mapped_column(JSON)
    brief_schema_version: Mapped[str] = mapped_column(String(16), default="1.0")
    public_proxy_glb_asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    preview_image_asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    generation_log_asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    renderer_version: Mapped[str] = mapped_column(String(80), default="safe-proxy-v1")
    source_claim_ids_json: Mapped[JsonList] = mapped_column(JSON, default=list)
    source_observation_ids_json: Mapped[JsonList] = mapped_column(JSON, default=list)
    is_nonfunctional: Mapped[bool] = mapped_column(Boolean, default=True)
    real_scale_removed: Mapped[bool] = mapped_column(Boolean, default=True)
    parts_joined: Mapped[bool] = mapped_column(Boolean, default=True)
    no_moving_parts: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_for_public_display: Mapped[bool] = mapped_column(Boolean, default=False)
    __table_args__ = (
        UniqueConstraint("hypothesis_id", "version_number"),
        CheckConstraint("is_nonfunctional = true"),
        CheckConstraint("real_scale_removed = true"),
        CheckConstraint("parts_joined = true"),
        CheckConstraint("no_moving_parts = true"),
    )


class ModelRun(UUIDTimestampMixin, Base):
    __tablename__ = "model_runs"
    run_type: Mapped[str] = mapped_column(String(80))
    provider: Mapped[str] = mapped_column(String(120))
    model: Mapped[str] = mapped_column(String(180))
    prompt_version: Mapped[str] = mapped_column(String(80))
    temperature: Mapped[float] = mapped_column(Float, default=0.0)
    input_hash: Mapped[str] = mapped_column(String(64), index=True)
    input_summary: Mapped[str] = mapped_column(String(500))
    output_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    validation_status: Mapped[str] = mapped_column(String(32), default="pending")
    error_message: Mapped[str] = mapped_column(Text, default="")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Job(UUIDTimestampMixin, Base):
    __tablename__ = "jobs"
    job_type: Mapped[str] = mapped_column(String(80), index=True)
    payload_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    idempotency_key: Mapped[str] = mapped_column(String(180), unique=True)
    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    run_after: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_by: Mapped[str | None] = mapped_column(String(180), nullable=True)
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str] = mapped_column(Text, default="")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditEvent(UUIDTimestampMixin, Base):
    __tablename__ = "audit_events"
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True)
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[UUID | None] = mapped_column(nullable=True)
    before_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    after_json: Mapped[JsonObject] = mapped_column(JSON, default=dict)
    request_id: Mapped[str] = mapped_column(String(100), index=True)
