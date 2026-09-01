# Architecture decisions

## ADR-001 — Evidence is the publication unit

Claims, observations, features, timeline entries, and reconstruction features carry evidence identifiers and explicit review state. AI output is always `proposed`; only a human review transition can make it accepted.

## ADR-002 — PostgreSQL is both system of record and queue

The worker claims jobs with `SELECT … FOR UPDATE SKIP LOCKED`. This avoids Redis in the MVP, supports multiple workers, and keeps retries, heartbeats, idempotency, and auditability in one transactional system.

## ADR-003 — Originals use content-addressed object storage

Object keys derive from SHA-256. Original filenames remain metadata only. Every fetch creates an immutable snapshot row; source records point to history rather than an overwritten blob.

## ADR-004 — Sensitive text is filtered before AI and public search

Exact measurements, manufacturing/assembly/operation instructions, acquisition information, and other controlled content are flagged. Concrete measurements are never copied into flag records. AI/search receive only public-safe chunks.

## ADR-005 — Reconstruction is a constrained visual hypothesis

`ReconstructionBriefV1` accepts only reviewed evidence. The renderer uses rounded abstract surfaces, a neutral central insert, one joined mesh, unitless normalization, and no moving structure. It is a nonfunctional museum visualization, not a replica or manufacturing model.

## ADR-006 — Graceful capability degradation

The API, worker, review tools, exhibit, and fixture viewer run without Blender or a live AI provider. Missing Blender returns `capability unavailable`; it never creates a false render status.

## ADR-007 — Bilingual content without duplicating research truth

Interface messages and exhibit framing are bilingual. Evidence records preserve their original language, while translations are presentation data and never become evidence by themselves.

## ADR-008 — Semantic-web inspiration, not conformance

The entity/event model is CIDOC CRM-inspired and does not claim complete CIDOC CRM conformance.

## ADR-009 — Period selectors are research frames, not chronology claims

The public design-evolution timeline may group sources into date-bounded review
frames before a chronology is publishable. Those frames expose source coverage,
review status, gaps, and zero-valued accepted-evidence counts; they do not become
historical nodes. A frame can display a real visual proxy only after accepted
claims, accepted observations, approved public-safe features, and an approved
Reconstruction Brief exist. The fictional A-01 demonstrator is isolated from
all real periods.

## ADR-010 — 3D presentation motion never models operation

The browser may rotate the camera around the single joined proxy manually or as
a slow turntable. It does not animate parts, reproduce a manipulation sequence,
or expose joint, grip, angle, speed, measurement, or frame-step controls. Media
and performance history is represented through reviewed records and still-image
observations rather than operational motion simulation.

## ADR-011 — Literary movement becomes a narrative cue, not object kinematics

Fiction, film, oral history, and other media may support reviewed claims about
representation and cultural imagination. A `NarrativeMotionStudyV1` can render
camera movement or detached abstract cues for circulation, attention, and
uncertainty. It cannot derive or store object-part motion, joint motion,
operational sequences, frame breakdowns, grip, angle, or speed. Until a media
record has locatable accepted observations, every real-period motion proxy stays
locked; the animated A-01 scene is explicitly fictional.
