# API

FastAPI generates OpenAPI at `/docs` in non-production environments. Version prefix: `/api/v1`.

## Routes

- Auth: login, logout, current user.
- Projects: list/create/get/patch, publish, unpublish.
- Artifacts: project list/create, get/patch, evidence, timeline, reconstructions.
- Sources: upload, one URL, IIIF, manual record, get/patch/process, chunks, snapshots, flags.
- Assets/observations: project assets, asset detail, manual/AI proposals, patch, accept, reject.
- Claims: project list/extract, get/patch, accept/reject/dispute, evidence create/list.
- Evidence review: reviewers can verify a concrete claim-evidence link at `POST /claim-evidence/{id}/verify`.
- Evidence: project graph, contradictions, confidence recalculation.
- Search/QA: project search and evidence-grounded ask.
- Reconstruction: artifact features/hypotheses, brief generation/approval, safe-render job, version/report.
- Jobs/audit: list/get/retry/cancel and audit list.
- Public: exhibit, timeline, artifacts, sources, reconstructions, evidence-grounded ask, and controlled inline public assets at `GET /public/assets/{id}`.

Public asset responses are authorized from database rights metadata on every request and use `Content-Disposition: inline`; the endpoint is an access gate, not an absolute DRM mechanism.

Unsafe authenticated requests require the double-submit CSRF header. Errors use a consistent `error` object with `code`, `message`, `details`, and `request_id`.

Public QA returns structured citations or the fixed insufficient-evidence sentence. Controlled bilingual questions redirect to historical, cultural, design, media, archive, and evidence topics.
