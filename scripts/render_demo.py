import json
from pathlib import Path

from app.services.reconstruction.backend import SafeProxyBackend
from app.services.reconstruction.brief import ReconstructionBriefV1

fixture = Path("data/seed/demo-reconstruction-brief.json")
if not fixture.exists():
    raise SystemExit("Run make seed/export-demo-brief or use the browser fixture; no brief JSON is present.")
brief = ReconstructionBriefV1.model_validate_json(fixture.read_text())
result = SafeProxyBackend().export_public_proxy(brief, Path("data/storage/demo-render"))
print(json.dumps(result, indent=2))
