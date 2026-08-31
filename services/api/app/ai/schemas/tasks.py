from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AISchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EvidenceSpan(AISchema):
    chunk_id: UUID
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)
    short_excerpt: str = Field(max_length=500)

    @model_validator(mode="after")
    def valid_range(self) -> "EvidenceSpan":
        if self.end_offset <= self.start_offset:
            raise ValueError("Evidence span end must be after start")
        return self


class ClaimProposal(AISchema):
    statement: str
    claim_type: Literal["origin", "chronology", "attribution", "production", "geographic_association", "cultural_significance", "design_change", "craft_tradition", "media_representation", "terminology", "regulation_context", "visual_feature"]
    certainty: float = Field(ge=0, le=1)
    evidence_spans: list[EvidenceSpan] = Field(min_length=1)
    requires_human_review: Literal[True] = True
    notes: str = ""


class ClaimProposalOutput(AISchema):
    claims: list[ClaimProposal]


class EntitySuggestion(AISchema):
    label: str
    aliases: list[str]
    entity_type: Literal["object", "person", "place", "institution", "event", "period", "style", "material_appearance", "publication", "media_work"]
    supporting_spans: list[EvidenceSpan]
    uncertainty: float = Field(ge=0, le=1)
    notes: str = ""


class EntityExtractionOutput(AISchema):
    entities: list[EntitySuggestion]


class ImageObservationProposal(AISchema):
    observation_type: Literal["silhouette", "external_form", "surface_motif", "handle_form", "color_appearance", "material_appearance", "decorative_pattern", "wear_pattern", "visible_marking", "viewpoint", "occlusion", "photographic_context"]
    description: str
    epistemic_state: Literal["observed", "inferred", "unknown"]
    confidence: float = Field(ge=0, le=1)
    normalized_bbox: dict[str, float] = Field(default_factory=dict)
    requires_human_review: Literal[True] = True


class ImageObservationOutput(AISchema):
    observations: list[ImageObservationProposal]


class ContradictionOutput(AISchema):
    classification: Literal["compatible", "partially_conflicting", "directly_conflicting", "unrelated"]
    conflict_type: str | None
    reason: str
    claim_a_evidence_ids: list[UUID]
    claim_b_evidence_ids: list[UUID]
    same_original_source_possible: bool
    requires_expert_review: bool


class SourceSummaryOutput(AISchema):
    source_type: str
    summary: str
    main_contributions: list[str]
    explicit_limitations: list[str]
    possible_biases: list[str]
    relevance: str
    verifiable_claim_count: int = Field(ge=0)
    unresolved_questions: list[str]
    is_evidence: Literal[False] = False


class ResearchGapOutput(AISchema):
    missing_source_types: list[str]
    weak_periods: list[str]
    conflicting_claim_ids: list[UUID]
    visual_features_needing_images: list[str]
    expert_confirmation_needed: list[str]
    performs_search: Literal[False] = False
