# AI policy

AIProvider defines `generate_structured`, `analyze_image`, `embed_text`, and `health_check`.

- `mock`: deterministic, no network, CI-safe.
- `live`: OpenAI-style base URL and private server-side key; temperature 0.

Saved source content is untrusted data. Prompts isolate it and forbid instruction override. Models receive public-safe eligible chunks only. Output must pass versioned Pydantic schemas; the live adapter permits two repair attempts, then records failure without writing formal claims/observations.

Every run records provider/model, prompt version, temperature, input hash/summary, validated output/error, and timing. Keys, cookies, passwords, full restricted content, and redacted values are never stored.

Allowed AI roles: entity suggestions, claim/observation proposals, summaries, contradiction candidates, gaps, and evidence-grounded QA. AI may not search unknown URLs, add memory facts, convert legend into fact, accept itself, publish, treat generated media as evidence, or include controlled measurements/instructions/acquisition content.
