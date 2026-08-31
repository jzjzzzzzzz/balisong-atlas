# Security policy

Report vulnerabilities privately to the repository maintainers through GitHub Security Advisories. Do not include source originals, API keys, session cookies, passwords, private URLs, or controlled text in a public issue.

## Supported version

The current `main` branch is supported during MVP development.

## Security invariants

- Argon2 hashes; HttpOnly, SameSite session cookies; Secure cookies in production; CSRF validation.
- Same-origin CORS, request IDs, rate limits, structured logs, parameterized SQLAlchemy statements.
- MIME sniffing, size limits, normalized filenames, SVG rejection, isolated object storage.
- HTTP(S)-only URL ingestion, DNS/IP validation, private/link-local/metadata blocking, validation after redirects, five-redirect cap, body/time limits, trusted-domain approval.
- Source text is untrusted data; prompt injection cannot replace system instructions.
- Controlled measurements/instructions are redacted and excluded before AI/search/publication.
- Restricted originals and API credentials never appear in logs or model-run records.

Rotate any secret suspected of exposure and withdraw affected publications until rights and evidence validation is rerun.
