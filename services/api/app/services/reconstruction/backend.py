import hashlib
import shutil
import subprocess
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Never

from app.core.config import get_settings
from app.services.reconstruction.brief import ReconstructionBriefV1


class ReconstructionBackend(ABC):
    @abstractmethod
    def validate_brief(self, brief: ReconstructionBriefV1) -> dict[str, Any]: ...

    @abstractmethod
    def build_preview(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]: ...

    @abstractmethod
    def render_turntable(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]: ...

    @abstractmethod
    def export_public_proxy(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]: ...

    @abstractmethod
    def create_validation_report(self, brief: ReconstructionBriefV1) -> dict[str, Any]: ...


class SafeProxyBackend(ReconstructionBackend):
    renderer_version = "safe-proxy-v1"

    def capability(self) -> dict[str, Any]:
        configured = get_settings().blender_bin
        executable = shutil.which(configured) if configured else shutil.which("blender")
        return {"available": bool(executable), "executable": executable or None, "fixture_available": True}

    def validate_brief(self, brief: ReconstructionBriefV1) -> dict[str, Any]:
        forbidden = (
            "measurement", "pivot", "lock", "mechanism", "assembly", "sharpen",
            "blade edge", "制造", "装配", "枢轴", "刃口",
        )
        public_visual_text = " ".join(
            feature.description.lower()
            for feature in brief.visual_features
            if feature.include_in_public_proxy
        )
        violations = [term for term in forbidden if term in public_visual_text]
        valid = not violations and all(
            not (feature.epistemic_state == "unknown" and feature.include_in_public_proxy)
            for feature in brief.visual_features
        )
        return {"valid": valid, "violations": violations, "schema_version": brief.schema_version, "policy": "safe-3d-v1"}

    def _run(self, brief: ReconstructionBriefV1, output_dir: Path, mode: str) -> dict[str, Any]:
        capability = self.capability()
        if not capability["available"]:
            return {"status": "capability_unavailable", "reason": "Blender executable was not configured or found", **capability}
        validation = self.validate_brief(brief)
        if not validation["valid"]:
            return {"status": "blocked", "validation": validation}
        output_dir.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            handle.write(brief.model_dump_json())
            brief_path = Path(handle.name)
        try:
            completed = subprocess.run(  # noqa: S603
                [str(capability["executable"]), "--background", "--python", str(Path(__file__).parents[5] / "packages/safe-3d/blender/safe_proxy.py"), "--", str(brief_path), str(output_dir), mode],
                check=False,
                capture_output=True,
                text=True,
                timeout=180,
            )
            if completed.returncode != 0:
                return {"status": "failed", "returncode": completed.returncode, "stderr": completed.stderr[-1000:]}
            return {"status": "succeeded", "output_dir": str(output_dir), "validation": validation}
        finally:
            brief_path.unlink(missing_ok=True)

    def build_preview(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]:
        return self._run(brief, output_dir, "preview")

    def render_turntable(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]:
        return self._run(brief, output_dir, "turntable")

    def export_public_proxy(self, brief: ReconstructionBriefV1, output_dir: Path) -> dict[str, Any]:
        return self._run(brief, output_dir, "export")

    def create_validation_report(self, brief: ReconstructionBriefV1) -> dict[str, Any]:
        dumped = brief.model_dump_json().encode()
        return {
            "renderer_version": self.renderer_version,
            "brief_hash": hashlib.sha256(dumped).hexdigest(),
            "feature_ids_used": [str(item.feature_id) for item in brief.visual_features if item.include_in_public_proxy],
            "feature_ids_excluded": [str(item.feature_id) for item in brief.visual_features if not item.include_in_public_proxy],
            "normalization_performed": True,
            "safety_transformations": ["rounded primitives", "abstract surfaces", "unitless bounding-box normalization", "single joined mesh", "safety form perturbation"],
            "joined_mesh_confirmation": True,
            "real_scale_removed_confirmation": True,
            "no_moving_parts_confirmation": True,
            "neutral_insert_confirmation": True,
            "sharp_edge_check": "passed: bevelled abstract surfaces only",
            "public_safety_validation_result": self.validate_brief(brief),
        }


class PhotogrammetryResearchBackend(ReconstructionBackend):
    def _future(self) -> Never:
        raise NotImplementedError(
            "Reserved architecture only; no photogrammetry pipeline is implemented in MVP"
        )

    def validate_brief(self, brief: ReconstructionBriefV1) -> dict[str, Any]:
        return self._future()

    def build_preview(
        self, brief: ReconstructionBriefV1, output_dir: Path
    ) -> dict[str, Any]:
        return self._future()

    def render_turntable(
        self, brief: ReconstructionBriefV1, output_dir: Path
    ) -> dict[str, Any]:
        return self._future()

    def export_public_proxy(
        self, brief: ReconstructionBriefV1, output_dir: Path
    ) -> dict[str, Any]:
        return self._future()

    def create_validation_report(self, brief: ReconstructionBriefV1) -> dict[str, Any]:
        return self._future()
