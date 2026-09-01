# Balisong Atlas

**Balisong Atlas — An AI-Assisted Visual History of the Butterfly Knife**
**Balisong Atlas｜蝴蝶刀设计史数字图谱**

> Every reconstruction should reveal its evidence.
> 每一次重建，都应当展示它的证据。

Balisong Atlas is an evidence-first digital archive and AI-assisted visual reconstruction platform for studying the cultural, historical, and design evolution of the balisong, also known as the butterfly knife.

Balisong Atlas 是一个以证据为基础的数字档案与 AI 辅助视觉重建平台，用于研究 balisong，也就是蝴蝶刀的文化史、设计史、工艺传统、传播过程与视觉演变。

The repository is a research and cultural-heritage system—not a store, operation guide, manufacturing resource, appraisal service, or movement tutorial.

## Exhibition 01

**Between Two Handles: A Visual History of the Balisong**
**双柄之间：蝴蝶刀的视觉设计史**

The seed creates this real exhibition structure in `draft` with no historical conclusions. A separate, wholly fictional **Balisong Atlas Demo Collection** proves the software workflow without adding real measurements, technical drawings, instructions, acquisition links, or usable models.

## Architecture

```text
[Next.js bilingual web]
           |
           v
[FastAPI /api/v1] ----------------------> [MinIO / S3]
           |                               SHA-256 object keys
           v
[PostgreSQL 16 + pgvector]
           |
           v
[jobs table: FOR UPDATE SKIP LOCKED]
           |
           v
[Python worker]
  | source snapshots, PDF/HTML/image parsing, OCR jobs
  | sensitive-content redaction and public-safe chunks
  | deterministic mock or OpenAI-compatible structured AI
  | evidence scoring, source families, contradictions
  | ReconstructionBriefV1 and publication validation
  + optional Blender SafeProxyBackend
```

The browser viewer always has a safe abstract GLB fixture. When Blender is absent, the renderer reports `capability_unavailable`; it does not claim that a Blender render occurred.

## Prerequisites

- Docker Desktop / Docker Engine with Compose
- Node.js 22 and Corepack
- Python 3.12+ and `uv`
- Optional: Blender, configured with `BLENDER_BIN`

The checked-in `pnpm-lock.yaml` and `uv.lock` lock dependency resolution. Container tags and Python/Node base images are pinned in the Dockerfiles/Compose file.

## Local startup

```bash
cd balisong-atlas
make bootstrap        # creates .env with random local-only secrets and installs locked deps
docker compose config # optional configuration check
make dev              # docker compose up --build
```

Open:

- Web: <http://localhost:3000>
- API: <http://localhost:8000>
- OpenAPI: <http://localhost:8000/docs>
- MinIO console: <http://localhost:9001>

Stop with `make down`; inspect logs with `make logs`.

## Create an administrator

There is no default administrator password.

```bash
make create-admin EMAIL=example@example.com
```

The command asks for a password interactively and stores an Argon2 hash. It does not print or log the password.

## Migrations and seed

```bash
make migrate
make seed
make process-demo
```

`make seed` is idempotent. It creates:

- draft `between-two-handles` exhibition structure;
- published fictional demo collection;
- one fictional artifact, a short fixture PDF, two abstract fixture images;
- two accepted claims, one disputed claim, three accepted observations, four reviewed features;
- one approved ReconstructionBriefV1 and one unitless single-mesh GLB fixture.

## Upload and process a source

In the research workspace, open **Sources** and use upload, approved URL, IIIF, or manual record entry. The API equivalent is:

```bash
curl -b cookies.txt -H "x-csrf-token: $CSRF" \
  -F file=@source.pdf -F title="Archive record" \
  -F rights_status=unknown -F source_tier=D \
  http://localhost:8000/api/v1/projects/PROJECT_ID/sources/upload
```

Every upload receives a SHA-256 key and immutable `source_snapshot`. The worker creates page-aware chunks and regions, extracts safe image metadata, flags controlled content, and stores `public_safe_text`. URL ingestion is limited to trusted or explicitly approved domains and revalidates every redirect against SSRF rules.

## Mock AI

Default `.env` behavior:

```dotenv
AI_MODE=mock
EMBEDDING_ENABLED=false
```

Mock output is deterministic, structured, evidence-bound, and uses no network. CI uses only mock mode. AI claims and observations are always written as `proposed`; no model can accept its own result.

## Live OpenAI-compatible AI

```dotenv
AI_MODE=live
LLM_BASE_URL=https://your-compatible-service.example/v1
LLM_API_KEY=your-local-secret
LLM_MODEL=your-model
VISION_MODEL=your-vision-model
EMBEDDING_MODEL=your-embedding-model
EMBEDDING_ENABLED=true
```

The adapter calls OpenAI-style `/chat/completions` and `/embeddings`, supports a custom base URL, sends vision input as a standard data URL, uses temperature 0, validates Pydantic structured output, and makes at most two repair attempts. Keys stay server-side and are excluded from logs/model-run records. Deterministic mock image observation remains the CI default.

## Rights management

Rights are a publication gate:

| Status | Public behavior |
|---|---|
| `public_domain` | original may be displayed |
| `licensed` | display only with license/attribution |
| `permission_granted` | display with permission note |
| `metadata_only` | metadata only |
| `unknown` | original hidden by default |
| `restricted` | administrator only |

Publication validation also checks evidence completeness, review state, uncertainty, synthetic labels, controlled text, excerpt length, and reconstruction approval.

## Evidence-first method

1. Preserve source, access metadata, rights, hash, and immutable snapshot.
2. Parse locations and create redacted public-safe text.
3. Let AI or a researcher propose a claim/observation from saved corpus context.
4. Bind the proposal to a chunk, page, region, asset, or reviewed image observation.
5. Human-review the evidence and state transition.
6. Retain support, context, source dependency, and contradiction.
7. Generate timelines/features only from accepted material.
8. Generate a Reconstruction Brief only from accepted evidence-bound visual features.

The confidence formula is transparent and advisory:

```text
0.30 source_quality + 0.25 evidence_directness + 0.20 source_independence
+ 0.15 cross_source_agreement + 0.10 temporal_proximity
```

A Tier D source cannot produce a `high` label. Scores never replace reviewer judgment.

## Literature collection

The research register deliberately ranks archives and books ahead of papers, and papers ahead of ordinary web posts. This is a discovery preference—not a truth score. Old books, institutional catalogues, oral histories, and recent scholarship still receive independent source criticism.

```bash
make collect-literature
make screen-literature
make source-thumbnails
```

The command builds `data/research/bibliography.json`, downloads only explicitly allow-listed research files, records actual hashes and failures in `data/research/download-report.json`, and writes originals into ignored content-addressed storage under `data/storage/research/sha256/`. Every new research copy is private and excluded from AI, embeddings, public search, and publication until rights and sensitive-content review are complete. Loan-only and unavailable works remain metadata records; the collector does not bypass access controls.

The screening command performs a local, deterministic relevance pass over the
private PDFs. It stores aggregate term-group counts and page numbers only—not
source text or excerpts—and its ranking is a review queue rather than evidence.
The current register contains 93 catalogued records, 77 private PDF research
copies, and 24 public-safe metadata records prioritized for review. The
thumbnail command renders only three public-domain title pages for
bibliographic navigation; it does not expose private PDFs or technical plates.

The public design-evolution timeline groups sources into explicit **research
frames**, not asserted historical periods. Selecting a frame shows its sources,
review state, gaps, and reconstruction readiness. A real-period 3D proxy remains
locked until claims, observations, and visual features are accepted by a human
reviewer. The fictional A-01 proxy is available only as a clearly separated
method demonstrator. A separate performance/media layer renders a smooth,
procedural **balisong kinetic visual study** in React Three Fiber. Two stylized
handles move around a rounded central display insert while the assembly turns in
a continuous loop. Five research frames now select five separate external
geometry families—not recolors—and show an evidence dossier, observed/inferred/
unknown state, source path, and public-domain bibliographic folios. They remain
interpretive display studies rather than exact period replicas.

See [docs/LITERATURE_REVIEW.md](docs/LITERATURE_REVIEW.md) for the ranked register, evaluation notes, and open research gaps.

## Safe 3D

Public output is an **evidence-based visual hypothesis**, **interpretive reconstruction**, **nonfunctional museum visualization**, or **visual proxy**. SafeProxyBackend:

- reads only public-safe visual brief fields;
- uses rounded, abstract surfaces and a neutral central insert;
- joins output into one mesh, applies transforms, removes real units/scale, normalizes bounds;
- creates no internal structure, armature, constraints, joints, animation, or separated parts;
- emits GLB metadata `NONFUNCTIONAL MUSEUM VISUALIZATION` and a validation report.

The public viewer offers manual whole-scene rotation, a slow whole-scene turntable, limited zoom, background choice, evidence annotations, legend, and version/brief information. It contains no download, measurement, section, exploded-view, part-isolation, joint, part/operation animation, export, conversion, or real-unit control.

The kinetic study is a browser-only procedural exhibit and is not emitted by
`SafeProxyBackend`. It has no download, measurement, export, frame-step, or
joint-editing interface and does not alter the joined-GLB reconstruction policy.
Its anchor/blade/free-handle hierarchy was visually checked against
[DJLO's CC BY-SA 3.0 Wikimedia Commons opening/closing reference](https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif);
the source file is linked and attributed in the interface but is not bundled in
the repository.
The contemporary preset also uses a public manufacturer anatomy article to
calibrate broad visible design language—slender form, narrow channel-style
handles, surface slots, pivot caps, and subdued metal finishes—without copying a
named product or ingesting its measurements.
The era selector changes public-safe external geometry rather than merely
recoloring one object: each frame has a distinct handle treatment and central
silhouette, with the sidebar stating whether that difference is observed,
inferred, or unknown.

Browser assets cannot receive absolute DRM. “No download button” is an interface/access-control decision, not a promise that a displayed asset can never be saved.

## Tests and checks

```bash
make lint       # ESLint + ruff
make typecheck  # TypeScript + mypy strict
make test       # Playwright + pytest
corepack pnpm build  # production Next.js build
```

Install the Playwright browser once if needed:

```bash
corepack pnpm --filter @balisong-atlas/web exec playwright install chromium
```

## Deployment

1. Generate production secrets outside source control.
2. Set production PostgreSQL/pgvector and S3-compatible storage.
3. Set `APP_ENV=production`, HTTPS origins, secure cookie origin, and trusted domains.
4. Run `alembic upgrade head` as a release step.
5. Run API and multiple workers separately; expose only web/API through TLS reverse proxy.
6. Keep original/restricted objects private; use short-lived signed access.
7. Run publication validation before every publish/republish.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Current limitations

- Blender rendering requires an external Blender installation and was not run in environments where `BLENDER_BIN` is absent; the fixture viewer still works.
- OCR is represented as a queued capability; a site-specific OCR engine/language-pack deployment is required for scanned pages.
- Semantic search is optional; the schema uses pgvector, while embeddings remain disabled by default.
- Some OpenAI-compatible vendors do not implement strict JSON Schema or the standard vision data-URL message shape; those vendors may require an adapter override.
- The MVP ingests only explicit uploads, one approved URL, or one IIIF manifest. It does not search or crawl the web.
- Project, artifact, source-ingest, and claim-review screens use the live API. Several analytical boards in the first UI release present the fictional fixture while their corresponding read/write APIs remain available.
- Browser no-download controls are not absolute DRM.

## Repository and licenses

Code is MIT licensed. Data, source files, images, IIIF metadata, and exhibition text have separate rights and attribution records. See [LICENSE](LICENSE), [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md).
