# Threat model

## Assets

Accounts/sessions; original/restricted sources; rights decisions; review states; provider credentials; object storage; public exhibit integrity; audit/model-run history.

| Threat | Controls |
|---|---|
| Account takeover | Argon2, interactive admin creation, HttpOnly/SameSite, Secure production cookie, CSRF, rate limiting |
| SSRF | HTTP(S) only, DNS/IP validation, private/link-local/metadata blocking, redirect revalidation, trust approval, limits |
| Malicious upload | size/signature checks, normalized name, SVG reject, content-addressed isolation |
| Stored XSS | HTML sanitization, React escaping, no public raw source HTML |
| Prompt injection | untrusted delimiters, public-safe chunks, fixed policy, schemas, no model URL tools |
| Controlled-content leak | flags, redaction, exclusions, publication validator, no raw flag/log values |
| Rights breach | metadata-only/unknown defaults, attribution checks, private objects |
| Review forgery | server state transitions, accepted-evidence requirement, audits |
| Queue race | idempotency, SKIP LOCKED, heartbeat, timeout, retry cap |
| Unsafe reconstruction | accepted-evidence brief, human approval, backend report, limited viewer |
| Secret leak | server env, body-free logs, sanitized headers/run summaries |

Residual risks include browser asset saving, reviewer error, source miscataloging, compromised administrators, and vendor-specific model behavior.
