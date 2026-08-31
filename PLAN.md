# Balisong Atlas implementation plan

Updated: 2026-08-31 (Asia/Singapore)

## Environment observed before implementation

- Workspace: `/Users/jz`; target directory did not exist.
- Node.js: 22.23.0; Corepack: 0.35.0; standalone `pnpm` was not installed.
- Python: 3.13.14 (the project supports 3.12+); `uv`: 0.11.28.
- Docker CLI: 29.6.1.
- Blender was not installed. The platform must therefore expose rendering as unavailable and use the abstract fixture for viewer tests.
- No pre-existing Balisong Atlas files were removed or overwritten.

## Delivery phases

1. Establish the monorepo, package locks, configuration, health endpoints, Docker Compose, PostgreSQL/pgvector, and MinIO.
2. Implement typed database models, migration, authentication, audit events, projects, and artifacts.
3. Implement content-addressed ingestion, rights metadata, safe URL validation, parsers, image metadata, sensitive-content redaction, and snapshots.
4. Implement the PostgreSQL job queue, deterministic mock AI, structured schemas, claim and observation proposals, and review workflows.
5. Implement evidence scoring, source-family grouping, contradiction detection, search/QA gates, timeline, and evidence graph.
6. Implement ReconstructionBriefV1, safety validation, the Blender safe-proxy script, a nonfunctional demo GLB, and capability reporting.
7. Implement the bilingual research workspace and public digital-museum exhibit.
8. Add seed data, fixtures, documentation, CI, and executable tests; run every check available in this environment.

## Definition of done for this checkout

- Core flows are implemented without placeholder TODOs.
- Mock AI requires no external key and never auto-accepts output.
- Safety and publication policies are enforced in services and covered by tests.
- Docker Compose configuration is complete, while successful container startup is reported only if actually run.
- Blender-dependent rendering is optional and is never reported as available when `BLENDER_BIN` is absent.

