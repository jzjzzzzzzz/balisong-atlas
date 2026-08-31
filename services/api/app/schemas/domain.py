from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)

from app.services.ingestion.sensitive import contains_blocked_content


def reject_controlled_text(value: str | None) -> str | None:
    if value is not None and contains_blocked_content(value):
        raise ValueError(
            "Text contains controlled measurement, manufacturing, operational, or purchasing content"
        )
    return value


def reject_controlled_text_list(values: list[str]) -> list[str]:
    for value in values:
        reject_controlled_text(value)
    return values


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class LoginRequest(APIModel):
    email: EmailStr
    password: str


class UserRead(APIModel):
    id: UUID
    email: EmailStr
    role: str


ProjectStatus = Literal["draft", "collecting", "researching", "reviewing", "published", "archived"]


class ProjectCreate(APIModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1, max_length=500)
    subtitle: str = ""
    description: str = ""
    primary_language: str = "en"
    secondary_language: str = "zh"

    _safe_project_text = field_validator("title", "subtitle", "description")(
        reject_controlled_text
    )


class ProjectPatch(APIModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    public_visibility: bool | None = None

    _safe_project_text = field_validator("title", "subtitle", "description")(
        reject_controlled_text
    )


class ProjectRead(ProjectCreate):
    id: UUID
    status: ProjectStatus
    public_visibility: bool
    created_at: datetime
    updated_at: datetime


class ArtifactCreate(APIModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    preferred_name: str
    alternative_names_json: list[str] = Field(default_factory=list)
    record_type: Literal["museum_object", "documented_object", "design_type", "reconstruction_subject"]
    institution_name: str = ""
    accession_reference: str = ""
    approximate_date_text: str = ""
    geographic_association_text: str = ""
    cultural_context: str = ""
    public_summary: str = ""
    research_notes: str = ""
    record_status: Literal["proposed", "verified", "disputed", "archived"] = "proposed"

    _safe_artifact_text = field_validator(
        "preferred_name",
        "institution_name",
        "accession_reference",
        "approximate_date_text",
        "geographic_association_text",
        "cultural_context",
        "public_summary",
        "research_notes",
    )(reject_controlled_text)
    _safe_alternative_names = field_validator("alternative_names_json")(
        reject_controlled_text_list
    )


class ArtifactPatch(APIModel):
    preferred_name: str | None = None
    alternative_names_json: list[str] | None = None
    institution_name: str | None = None
    accession_reference: str | None = None
    approximate_date_text: str | None = None
    geographic_association_text: str | None = None
    cultural_context: str | None = None
    public_summary: str | None = None
    research_notes: str | None = None
    record_status: Literal["proposed", "verified", "disputed", "archived"] | None = None

    _safe_artifact_text = field_validator(
        "preferred_name",
        "institution_name",
        "accession_reference",
        "approximate_date_text",
        "geographic_association_text",
        "cultural_context",
        "public_summary",
        "research_notes",
    )(reject_controlled_text)

    @field_validator("alternative_names_json")
    @classmethod
    def safe_alternative_names(cls, value: list[str] | None) -> list[str] | None:
        return reject_controlled_text_list(value) if value is not None else None


class ArtifactRead(ArtifactCreate):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime


class ManualSourceCreate(APIModel):
    source_type: Literal["manual_note", "catalog_record", "academic_article", "book", "oral_history"]
    title: str
    creator: str = ""
    institution: str = ""
    publisher: str = ""
    publication_date_text: str = ""
    original_language: str = ""
    rights_status: Literal["public_domain", "licensed", "permission_granted", "metadata_only", "unknown", "restricted"] = "unknown"
    rights_uri: str = ""
    license_label: str = ""
    attribution_text: str = ""
    source_tier: Literal["A", "B", "C", "D"] = "D"
    notes: str = ""

    _safe_source_text = field_validator("title", "notes", "attribution_text")(
        reject_controlled_text
    )


class URLSourceCreate(APIModel):
    url: HttpUrl
    title: str = "Pending URL metadata"
    administrator_approved: bool = False
    rights_status: Literal["public_domain", "licensed", "permission_granted", "metadata_only", "unknown", "restricted"] = "unknown"
    source_tier: Literal["A", "B", "C", "D"] = "D"

    _safe_title = field_validator("title")(reject_controlled_text)


class IIIFSourceCreate(APIModel):
    manifest_url: HttpUrl
    administrator_approved: bool = False


class SourcePatch(APIModel):
    title: str | None = None
    creator: str | None = None
    institution: str | None = None
    source_tier: Literal["A", "B", "C", "D"] | None = None
    rights_status: Literal["public_domain", "licensed", "permission_granted", "metadata_only", "unknown", "restricted"] | None = None
    rights_uri: str | None = None
    license_label: str | None = None
    attribution_text: str | None = None
    public_display_allowed: bool | None = None
    notes: str | None = None

    _safe_source_text = field_validator("title", "notes", "attribution_text")(
        reject_controlled_text
    )


class ClaimCreate(APIModel):
    artifact_id: UUID | None = None
    claim_type: Literal["origin", "chronology", "attribution", "production", "geographic_association", "cultural_significance", "design_change", "craft_tradition", "media_representation", "terminology", "regulation_context", "visual_feature"]
    statement: str
    language: str = "en"
    proposed_by: Literal["human", "ai"] = "human"

    @field_validator("statement")
    @classmethod
    def reject_controlled_content(cls, value: str) -> str:
        return str(reject_controlled_text(value))


class EvidenceCreate(APIModel):
    source_id: UUID
    source_chunk_id: UUID | None = None
    asset_id: UUID | None = None
    image_observation_id: UUID | None = None
    relation: Literal["supports", "contradicts", "contextualizes"]
    short_excerpt: str = Field(default="", max_length=500)
    page_number: int | None = Field(default=None, ge=1)
    section_title: str = ""
    bounding_box_json: dict[str, Any] = Field(default_factory=dict)
    evidence_directness: float = Field(ge=0, le=1)
    evidence_independence: float = Field(ge=0, le=1)
    reviewer_verified: bool = False

    _safe_excerpt = field_validator("short_excerpt", "section_title")(
        reject_controlled_text
    )

    @model_validator(mode="after")
    def require_locator(self) -> "EvidenceCreate":
        if not any([self.source_chunk_id, self.asset_id, self.image_observation_id]):
            raise ValueError("Evidence must bind to a chunk, asset, or image observation")
        return self


class ObservationCreate(APIModel):
    artifact_id: UUID | None = None
    observation_type: Literal["silhouette", "external_form", "surface_motif", "handle_form", "color_appearance", "material_appearance", "decorative_pattern", "wear_pattern", "visible_marking", "viewpoint", "occlusion", "photographic_context"]
    description: str
    normalized_bbox_json: dict[str, float] = Field(default_factory=dict)
    normalized_polygon_json: list[dict[str, float]] = Field(default_factory=list)
    epistemic_state: Literal["observed", "inferred", "unknown"]
    confidence: float = Field(ge=0, le=1)
    proposed_by: Literal["human", "ai"] = "human"

    _safe_description = field_validator("description")(reject_controlled_text)


class FeatureCreate(APIModel):
    label: str
    category: Literal["silhouette", "external_form", "handle_form", "surface_motif", "decorative_style", "color_appearance", "material_appearance", "visible_marking"]
    description: str
    epistemic_state: Literal["observed", "inferred", "unknown"]
    confidence_score: float = Field(ge=0, le=1)
    review_status: Literal["proposed", "accepted", "rejected", "needs_revision"] = "proposed"
    public_safe: bool = True
    excluded_from_geometry: bool = False
    reviewer_notes: str = ""
    evidence_claim_ids: list[UUID] = Field(default_factory=list)
    evidence_observation_ids: list[UUID] = Field(default_factory=list)

    _safe_feature_text = field_validator("label", "description")(
        reject_controlled_text
    )


class HypothesisCreate(APIModel):
    title: str
    description: str
    historical_period_text: str = ""
    confidence_score: float = Field(default=0.0, ge=0, le=1)
    human_rationale: str = ""

    _safe_hypothesis_text = field_validator(
        "title", "description", "historical_period_text", "human_rationale"
    )(reject_controlled_text)


class AskRequest(APIModel):
    question: str = Field(min_length=2, max_length=1000)
    language: Literal["en", "zh"] = "en"

class ClaimExtractionRequest(APIModel):
    source_id: UUID
    artifact_id: UUID | None = None
    chunk_ids: list[UUID] = Field(default_factory=list)


class ClaimPatch(APIModel):
    statement: str | None = None
    claim_type: str | None = None
    reviewer_notes: str | None = None

    _safe_claim_text = field_validator("statement", "reviewer_notes")(
        reject_controlled_text
    )


class ObservationPatch(APIModel):
    description: str | None = None
    epistemic_state: Literal["observed", "inferred", "unknown"] | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    reviewer_notes: str | None = None

    _safe_observation_text = field_validator("description", "reviewer_notes")(
        reject_controlled_text
    )


class FeaturePatch(APIModel):
    label: str | None = None
    description: str | None = None
    epistemic_state: Literal["observed", "inferred", "unknown"] | None = None
    confidence_score: float | None = Field(default=None, ge=0, le=1)
    review_status: Literal["proposed", "accepted", "rejected", "needs_revision"] | None = None
    public_safe: bool | None = None
    excluded_from_geometry: bool | None = None
    reviewer_notes: str | None = None

    _safe_feature_text = field_validator("label", "description", "reviewer_notes")(
        reject_controlled_text
    )
