# Architecture

Balisong Atlas is a pnpm/Python monorepo. Next.js never receives provider keys or unrestricted object-storage credentials. FastAPI owns authenticated commands and policy state transitions. PostgreSQL owns records and jobs. MinIO/S3 stores content-addressed immutable bytes.

```text
Browser -> Next.js -> FastAPI -> PostgreSQL + pgvector
                         |                |
                         v                v
                     MinIO/S3          jobs table
                                          |
                                          v
                                      worker(s)
```

## Boundaries

- **Web:** bilingual museum exhibit, research workspaces, evidence regions, constrained 3D viewer.
- **API:** authentication, validation, audit, repositories/services, OpenAPI under `/api/v1`.
- **Worker:** transactional job claims, heartbeat, retry/backoff, safe ingestion/AI/reconstruction tasks.
- **Object storage:** SHA-256 keys; original filename is metadata; snapshots are never overwritten.
- **AI adapter:** deterministic mock or configured OpenAI-compatible service; structured validation only.
- **Safe 3D:** validated ReconstructionBriefV1 to optional Blender backend or known fixture capability.

## Queue transaction

A worker selects one due `queued` job ordered by priority/created time using `FOR UPDATE SKIP LOCKED`, sets `running`, `locked_at`, `locked_by`, `heartbeat_at`, and increments attempts. It commits the claim before execution. Success/failure state is committed with handler effects. Stale jobs return through bounded retry; terminal failures remain visible.

## Degradation

The archive, review, search, publication validation, and fixture viewer run without AI keys or Blender. Missing external software is an explicit capability result, never a synthetic success.
