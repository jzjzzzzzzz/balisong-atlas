# Balisong Atlas Research Paper Implementation Plan

Status: active  
Created: 2026-09-01  
Working route: `/research/balisong-boundary-object`

## 1. Existing architecture confirmed

- The repository is the existing `balisong-atlas` monorepo; this work will extend it in place.
- The public web application is Next.js 15 App Router under `apps/web/app` with TypeScript strict mode.
- Public routes are currently unprefixed. Language selection is handled by the existing `Providers` context, the `atlas_locale` cookie, local storage, and `messages/en.json` / `messages/zh.json`; no locale-prefixed routes are used.
- The shared public navigation is `apps/web/components/MuseumHeader.tsx`.
- Styling is Tailwind plus the museum-specific rules in `apps/web/app/globals.css`. The paper will reuse the existing paper, ink, parchment, quiet, moss, and redline tokens, serif display face, mono labels, ruled borders, folio rails, and focus styles.
- The project does not currently include MDX, Markdown rendering, BibTeX rendering, CSL, or a CMS. Adding a CMS would be disproportionate.
- Public browser tests use Playwright in `apps/web/tests`; linting uses ESLint, type checking uses `tsc --noEmit`, and production verification uses `next build`.
- A 97-record literature inventory, 81 local research PDFs, screening metadata, certainty audit, and rights-reviewed public media already exist under `data/research`, ignored content-addressed storage, and `apps/web/public/research/media`.

## 2. Files to add or modify

### Research records

- Add the requested `research/` tree, including the research log, source and claim matrices, figure manifest, legal verification note, BibTeX library, download manifest, source notes, outline, draft, and revision log.
- Keep `research/library/raw/` private and ignored. Commit only metadata, hashes, review notes, and rights decisions.
- Add public-safe article content and presentation data under `content/research/`.

### Web publication

- Add `apps/web/app/research/balisong-boundary-object/page.tsx` and research-specific metadata.
- Add reusable components under `apps/web/components/research/`.
- Extend `MuseumHeader.tsx` and both message catalogs with `Research Paper / 论文`, preserving all current links.
- Extend `globals.css` with article, footnote, responsive, and print rules without changing existing exhibit styling.
- Add Playwright coverage in a separate research-paper test file.

### Validation and build integration

- Add `scripts/validate-research-paper.ts` and a root `validate:research` script.
- Validate citation keys, source status, figures and rights, legal as-of date, bilingual metadata, section citation coverage, prohibited links/content, and draft status.
- Keep validation dependency-free and compatible with the repository's pinned TypeScript/Node toolchain.

## 3. Content system decision

The paper will use a small, typed, repository-native content model rather than adding a CMS or upgrading the Next.js toolchain. Canonical article metadata, sections, notes, bibliography records, figures, and bilingual summaries will live in versioned content files and be rendered by React server/client components. A frontmatter-bearing Markdown research draft will be generated/checked against the same metadata and section data for scholarly portability; it will not become a second independently edited article.

This choice preserves:

- stable note numbers and bidirectional note links;
- fully typed rendering and bilingual switching through the existing provider;
- build-time validation without a new runtime parser;
- one canonical article body for screen and browser-print output;
- a straightforward route to MDX/CSL later if the publication grows.

## 4. Citation system decision

- Chicago Notes and Bibliography, 18th edition.
- Every note is assigned a stable identifier and one or more BibTeX citation keys.
- First references use full notes; later references use shortened notes rather than layout-dependent `ibid.`.
- `research/references.bib` is the authoritative citation-key registry.
- The web bibliography is built from structured metadata whose keys must match BibTeX; the validator fails on missing, unused (unless explicitly `background_only`), or mismatched keys.
- Notes use pinpoint pages only where the full text and relevant page were actually inspected. Web and legal sources use stable section, paragraph, or statutory locators where pagination is unavailable.

## 5. Research workflow

1. Re-screen the existing 97-record corpus and search official, institutional, and scholarly databases for theory, Philippine/local context, design, participation, and legal classification.
2. Log at least 40 candidates before drafting. Record full-text status honestly (`verified_full_text`, `verified_partial`, `abstract_only`, `metadata_only`, `inaccessible`, or `excluded`).
3. Download only lawful open-access files, calculate SHA-256, and keep them in ignored private research storage.
4. Write source notes before prose. Separate documented fact, visual observation, institutional framing, contested history, and authorial interpretation.
5. Build the claim–evidence matrix and reject or qualify claims whose support is dependent, indirect, abstract-only, or contradictory.
6. Bind each section-level argument to at least two independent sources.
7. Draft the outline, then the 6,000–7,000-word article, Chinese extended abstract, notes, bibliography, disclosures, and legal disclaimer.
8. Re-open each cited source, verify locators/DOIs/legal posture, and record revisions before web implementation.
9. Render the same canonical content for screen and print, then run validation, lint, typecheck, Playwright, build, and existing backend tests where available.

## 6. Research and publication boundaries

- The article is a material-culture, object-biography, design-history, visual-culture, participatory-culture, and legal-classification study.
- It will not publish measurements, true scale, mechanical parameters, assembly or manufacturing information, action sequences, handling guidance, purchasing links, carrying advice, or rule-avoidance guidance.
- Technical material encountered in a source is recorded only as excluded controlled content, never copied into notes, article text, embeddings, or public data.
- AI is a discovery, OCR-cleanup, classification, coding, and drafting aid—not evidence. Search snippets and generated text cannot support a claim.
- The paper will remain visibly labeled `Research Draft`; it will not claim peer review or definitive historical certainty.
- Legal analysis is historical and conceptual, uses primary legal texts for legal propositions, records an explicit as-of date, and is not advice about possession, purchase, transport, or use.

## 7. Risks and limits

- Local craft evidence is uneven, often mediated by institutional or later heritage framing, and may be available only in Filipino/English metadata or abstracts.
- Recurring origin narratives frequently share an unverified source family; repetition will not be treated as corroboration.
- Some academic books and theses may be metadata- or abstract-only. They may guide discovery but cannot support strong factual claims.
- Court opinions and statutes can be amended, superseded, or procedurally narrowed. Each legal proposition requires a current source-status check as of 2026-09-01.
- Image availability is not publication permission. Unknown-rights images will remain metadata-only.
- A browser “Save as PDF” workflow is reliable once print CSS is verified. A committed PDF will be produced only if the local browser render can be checked against the canonical page; otherwise the limitation will be recorded rather than implied away.
- The source targets are minimum coverage criteria, not proof that every historical question is resolved.

## 8. Completion gates

- Sources, notes, matrices, and outline exist before the full draft.
- At least 40 candidates are logged and at least 25 qualified sources are actually used.
- English article body is 6,000–7,000 words; English abstract is 150–200 words; Chinese abstract is 1,200–1,800 Chinese characters.
- Every major factual paragraph has a stable note; every core section has at least two independent sources.
- Research validation, lint, typecheck, build, Playwright, and non-regression checks report their actual result.

