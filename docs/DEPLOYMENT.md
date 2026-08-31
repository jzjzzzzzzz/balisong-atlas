# Deployment

## Development

`make bootstrap && make dev` starts Next.js, FastAPI, PostgreSQL/pgvector, the worker, MinIO, and bucket initialization. Migrations run before API startup.

## Production checklist

1. Use secret-manager values for `APP_SECRET`, S3, and optional AI credentials.
2. Use managed PostgreSQL with vector extension and backups/PITR.
3. Use a private S3-compatible bucket with encryption, lifecycle/versioning, and signed access.
4. Put web/API behind TLS; set production environment, origins, Secure cookie, and same-origin CORS.
5. Run migrations once per release, then API and independent workers.
6. Keep trusted URL domains narrow and monitor SSRF/body/time-limit rejections.
7. Keep original/restricted source access administrator-only.
8. Run CI in mock AI mode without external network or Blender dependency.
9. Run publication validation before publish and retain audit/generation reports.
10. Record the actual Blender version if that optional capability is enabled.

Back up PostgreSQL and object storage together so snapshot rows and addressed objects remain consistent.
