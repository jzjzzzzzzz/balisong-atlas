# Data model

Every core table uses a UUID primary key and timestamps. Important state changes add `audit_events` with actor, entity, request ID, and JSON before/after views.

## Core groups

- Identity: `users`, `audit_events`
- Projects/objects: `research_projects`, `artifact_records`, `artifact_source_links`
- Sources: `source_records`, immutable `source_snapshots`, located `source_chunks`, `assets`, `sensitive_content_flags`
- Knowledge: `entities`, `entity_relations`, `claims`, `claim_evidence`, `contradictions`
- Visual analysis: `image_observations`, `design_features`, `design_feature_evidence`
- Reconstruction: `reconstruction_hypotheses`, `reconstruction_versions`
- Operations: `model_runs`, `jobs`

Artifact records intentionally have no exact length/width/thickness, pivot distance, tolerances, angles, or mechanical parameters. Sensitive flags record only category/confidence/action—not a copied measurement value.

`source_chunks.embedding` is a nullable pgvector field. Full-text search uses a PostgreSQL GIN expression index on public-safe text. Semantic retrieval is optional and disabled by default.

Entity relations follow event-centric and typed-relation ideas. **This project is CIDOC CRM-inspired and does not claim complete CIDOC CRM conformance.**
