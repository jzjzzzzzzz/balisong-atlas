# Certainty Audit

## Purpose

This audit separates four questions that are often collapsed into one:

1. Does the cited source exist and have a reliable date?
2. Does the cited page explicitly contain the record being described?
3. Does that record directly show an external visual feature?
4. Does the source prove an origin, attribution, or transmission claim?

A positive answer to an earlier question does not imply a positive answer to a
later one. In particular, a dated source can be genuine while the historical
story inside it remains retrospective, dependent on oral tradition, or
contradicted by another source.

## Status language

- **Verified record**: the dated source explicitly contains the stated record
  or directly visible broad feature.
- **Corroborated lead**: more than metadata is available, but the original
  page image or independent source-family check is still missing.
- **Unresolved**: the source is relevant context, but it does not support the
  proposed historical or visual conclusion.

All claims remain `proposed` until a human reviewer signs the review event.
The AI research pass cannot change a claim to `accepted`.

## Findings from the 2026-09-01 pass

### Verified records

1. **1880, US Patent 229,706** - its drawing and specification document a
   clasp-knife whose two handle sections rotate around a central implement.
   This verifies a comparable external form in Solingen by 1880. It does not
   prove European origin of the Philippine balisong or a transmission route.
2. **1947, Ilang-Ilang** - the dated Philippine popular-fiction issue uses the
   term `balisong`. This verifies media vocabulary by October 1947, not origin,
   production chronology, or a period object form.
3. **1951, Philippine Educator report** - a contemporaneous account based on
   1950-1951 provincial visits records balisong knife-making within Batangas
   community industries. The process sentence remains excluded from AI and
   public search; the record does not establish invention or visual form.
4. **1971, Federal Register 36 FR 9263** - United States Customs used the term
   `Balisong` and described its broad folding appearance. Its statement about
   provenance is an agency assertion, not proof of provenance.
5. **1987, Philippine Supreme Court** - the decision reproduces official
   regulatory vocabulary containing both `fanknife` and `balisong`. It
   contributes no visual chronology.
6. **1994, Metalcraft** - the Philippine cultural reference explicitly treats
   balisong as Batangas metalcraft and records named external appearance
   categories. Earlier-date assertions in the entry remain retrospective.
7. **2016, De La Salle University thesis record** - the institutional record
   verifies the thesis identity, scope, and abstract-level focus on cultural
   identity. The full thesis is not available online.

### Corroborated leads

1. **1953 Taal local-history papers** - a paginated web transcription contains
   a `History of Balisong Knives` section and describes an established local
   industry. The original National Library page images must still be compared;
   the origin narrative inside the source remains retrospective testimony.
2. **1969 Ang Nayong Pilipino brochure** - CiNii Books confirms the brochure's
   bibliographic identity. A 2024 UPOU thesis locates and attributes a
   Batangas-and-balisong section to it. The original brochure is not locally
   available, so exact wording and imagery remain unaccepted.

### Unresolved questions

1. **1771 Perret relation** - the book, author, and date are verified; no
   reviewed plate identifies a balisong or a Philippine connection.
2. **1895-1919 Philippine period form** - regional and craft context is strong,
   but the screened corpus has not produced a directly identified period
   balisong image.
3. **1926 museum form** - USNM Bulletin 137 is a genuine museum catalogue, but
   the current review has not identified a balisong object within it.

## Public visualization consequence

The former `1771 comparative form` has been withdrawn. The earliest observed
comparative animation frame now begins with the documented 1880 patent form.
The Philippine 1947, 1951, 1953, and 1969 checkpoints distinguish verified
vocabulary or industry records from interpreted appearance. They must not be
labelled exact period replicas.

The complete machine-readable audit is stored in
`data/research/certainty-audit.json`.
