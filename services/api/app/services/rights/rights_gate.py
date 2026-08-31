from dataclasses import dataclass


@dataclass(frozen=True)
class RightsDecision:
    may_display_original: bool
    metadata_only: bool
    administrator_only: bool
    label: str


def evaluate_rights(status: str, attribution_text: str = "") -> RightsDecision:
    if status == "public_domain":
        return RightsDecision(True, False, False, "Public domain")
    if status == "licensed":
        return RightsDecision(bool(attribution_text), False, False, "Licensed")
    if status == "permission_granted":
        return RightsDecision(bool(attribution_text), False, False, "Permission granted")
    if status == "metadata_only":
        return RightsDecision(False, True, False, "Metadata only")
    if status == "restricted":
        return RightsDecision(False, False, True, "Restricted")
    return RightsDecision(False, True, False, "Rights unknown")
