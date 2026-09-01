# Interface redesign — Archival Reading Room

Updated: 2026-09-01

## Design skill

The redesign used OpenAI's `frontend-app-builder` skill from the official
`openai/plugins` repository:

<https://github.com/openai/plugins/tree/main/plugins/build-web-apps/skills/frontend-app-builder>

It was installed locally as `~/.codex/skills/frontend-app-builder`. The older
indexed `openai/skills` `frontend-skill` path no longer exists in the current
repository, so the active official plugin skill was used instead.

## Visual thesis

**An archival reading room crossed with a scholarly critical edition.** The
interface is a ruled folio rather than a collection of rounded product cards:

- carbon-black institutional masthead;
- warm uncoated paper and one library-red accent;
- oversized editorial serif titles with restrained Swiss/monospace metadata;
- numbered marginal rails, ruled ledgers, bibliography tables, and open bands;
- no commerce, product-rating, movement-tutorial, or dangerous visual language;
- no historical photography invented for decoration.

## Design references

- `docs/design/reading-room-concept-hero.png`
- `docs/design/reading-room-concept-sections.png`

These are synthetic layout concepts, not historical sources. Their sample
content is intentionally excluded from the corpus. See `docs/design/README.md`.

## Implemented surfaces

- public exhibit hero and draft state;
- ranked Reading Room register and full sources page;
- six-stage evidence method;
- approved/closed reconstruction states and bilingual notice;
- museum header, language control, footer, evidence legend, public subpages;
- research-desk masthead, ruled page heading, and navigation treatment;
- responsive bibliography list on mobile instead of a clipped desktop table.

## Visual verification

The in-app browser runtime reported no available browser, so the documented
fallback was Playwright Chromium. Verification used a 1440 × 1000 desktop
viewport and a 390 × 844 mobile viewport. Browser renders are saved as:

- `docs/design/reading-room-implementation-desktop.png`
- `docs/design/reading-room-implementation-mobile.png`

Both renders and the concept images were inspected at original detail.

### Fidelity ledger

| Comparison point | Concept | Implemented result |
|---|---|---|
| Masthead | Black institutional band, restrained text navigation | Same container, spacing rhythm, labels, and white/red treatment |
| Hero | 65/35 editorial split, large serif bilingual title, ruled status ledger | Same hierarchy and split; wording corrected to honest draft state |
| Container model | Folio rails, open bands, ruled tables; no default card grid | Same; cards removed from the public exhibit composition |
| Reading Room | Dense source table with red ranking and citation action | Same on desktop; converted to readable vertical records on mobile |
| Method | Six numbered stages on one horizontal editorial rail | Same on desktop and a sequential vertical reading order on mobile |
| Reconstruction | Dramatic black stage, evidence ledger, bilingual safety notice | Draft exhibit truthfully shows capability closed; fictional demo retains the safe viewer |
| Palette/type | Warm paper, carbon, library red; serif display + compact metadata | Implemented in Tailwind tokens and global CSS without gradients/glass effects |

The intentional difference is the real exhibition's empty reconstruction state:
the concept showed an abstract sample, while the implementation withholds it
because the real draft has no approved Reconstruction Brief. This preserves the
project's evidence and publication policy instead of creating a misleading
visual completion.

Desktop and mobile browser checks found no horizontal page overflow. Above the
fold retains only brand, exhibit title, status, evidence action, method action,
and the source-policy ledger; no unapproved marketing copy was introduced.
