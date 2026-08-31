from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BriefModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BilingualTitle(BriefModel):
    en: str
    zh: str


class HistoricalPeriod(BriefModel):
    label: str
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[UUID]


class VisualFeatureBrief(BriefModel):
    feature_id: UUID
    category: Literal["silhouette", "external_form", "handle_form", "surface_motif", "decorative_style", "color_appearance", "material_appearance", "visible_marking"]
    description: str
    epistemic_state: Literal["observed", "inferred", "unknown"]
    confidence: float = Field(ge=0, le=1)
    evidence_claim_ids: list[UUID]
    evidence_observation_ids: list[UUID]
    include_in_public_proxy: bool

    @model_validator(mode="after")
    def evidence_and_unknown_rules(self) -> "VisualFeatureBrief":
        if not self.evidence_claim_ids and not self.evidence_observation_ids:
            raise ValueError("Every visual feature must have an evidence ID")
        if self.epistemic_state == "unknown" and self.include_in_public_proxy:
            raise ValueError("Unknown features cannot be auto-completed into the public proxy")
        return self


class Uncertainty(BriefModel):
    description: str
    reason: Literal["missing_view", "conflicting_source", "poor_image_quality", "unsupported_inference", "uncertain_date", "uncertain_attribution"]
    related_feature_ids: list[UUID]


class ExcludedInformation(BriefModel):
    category: Literal["measurement", "mechanism", "manufacturing", "operation"]
    reason: Literal["Excluded by research and safety policy"] = "Excluded by research and safety policy"


class SafetyConstraints(BriefModel):
    nonfunctional: Literal[True] = True
    real_scale_removed: Literal[True] = True
    joined_mesh_only: Literal[True] = True
    no_internal_mechanism: Literal[True] = True
    no_moving_parts: Literal[True] = True
    no_manufacturing_exports: Literal[True] = True
    neutral_central_insert: Literal[True] = True
    no_sharpened_edge: Literal[True] = True


class ReconstructionBriefV1(BriefModel):
    schema_version: Literal["1.0"] = "1.0"
    project_id: UUID
    artifact_id: UUID
    hypothesis_id: UUID
    title: BilingualTitle
    historical_period: HistoricalPeriod
    visual_features: list[VisualFeatureBrief]
    uncertainties: list[Uncertainty]
    excluded_information: list[ExcludedInformation]
    safety_constraints: SafetyConstraints

    @model_validator(mode="after")
    def complete_policy_exclusions_and_uncertainty(self) -> "ReconstructionBriefV1":
        required = {"measurement", "mechanism", "manufacturing", "operation"}
        excluded = {item.category for item in self.excluded_information}
        if excluded != required:
            raise ValueError("All policy exclusion categories must be present exactly once")
        if len(excluded) != len(self.excluded_information):
            raise ValueError("Policy exclusion categories cannot be duplicated")
        uncertain_feature_ids = {
            item.feature_id
            for item in self.visual_features
            if item.epistemic_state != "observed"
        }
        labelled_feature_ids = {
            feature_id
            for uncertainty in self.uncertainties
            for feature_id in uncertainty.related_feature_ids
        }
        if not uncertain_feature_ids.issubset(labelled_feature_ids):
            raise ValueError("Every inferred or unknown feature requires an uncertainty entry")
        return self
