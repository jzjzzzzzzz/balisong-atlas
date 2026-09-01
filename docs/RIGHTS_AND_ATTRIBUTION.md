# Rights and attribution

Rights are recorded per source and asset with status, URI, license label, attribution, access time, and public-display decision.

- `public_domain`: display original.
- `licensed`: follow license and show attribution.
- `permission_granted`: show the permission note.
- `metadata_only`: metadata and safe citation only.
- `unknown`: hide original by default.
- `restricted`: administrator-only original.

IIIF imports preserve provider, `requiredStatement`, and rights. If rights are unclear, cache metadata and a permissible low-resolution thumbnail only; never assume high-resolution caching rights.

Code is MIT. Archive data, images, exhibition writing, and third-party metadata retain separate licenses and attribution.

## Public-domain source folios

The timeline bundles three reduced title-page images for bibliographic
navigation. They are rendered from the private content-addressed research
copies by `scripts/generate_source_thumbnails.py`; no interior technical plate
or measurement page is published.

- Manuel Sastrón, *Filipinas: pequeños estudios; Batangas y su provincia*
  (1895), University of Michigan scan via
  [Internet Archive](https://archive.org/details/filipinaspequeo01sastgoog),
  public-domain historical scan.
- *Official catalogue Philippine exhibits: Universal Exposition, St. Louis*
  (1904), Boston Public Library scan via
  [Internet Archive](https://archive.org/details/officialcatalogu00loui_2),
  public-domain historical scan.
- Herbert W. Krieger, *USNM Bulletin 137* (1926), Smithsonian Institution,
  [No Copyright — United States](https://doi.org/10.5479/si.03629236.137.1).

These title pages are not object-form evidence. Their public cards link to the
institutional or contributing-library record and state the limits of use.

## Motion reference

The browser kinetic exhibit is visually checked against three local,
open-licensed motion records from two source families:

- DJLO,
  “[Opening and closing a Balisong aka Butterfly Knife](https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_Balisong_aka_Butterfly_Knife.gif),”
  26 July 2011, Wikimedia Commons, CC BY-SA 3.0;
- DJLO,
  “[Opening and closing a balisong simple](https://commons.wikimedia.org/wiki/File:Opening_and_closing_a_balisong_simple.gif),”
  29 July 2011, Wikimedia Commons, CC BY-SA 3.0. This is grouped with the first
  record because it has the same creator and is not independent corroboration;
- Gumballwolf,
  “[A little bit of flipping](https://commons.wikimedia.org/wiki/File:A_little_bit_of_flipping.gif),”
  30 September 2020, Wikimedia Commons, CC BY-SA 4.0.

The GIFs are displayed as complete continuous loops with no frame stepping,
timing display, speed control, grip analysis, or instructional annotation. They
support broad body-order, whole-object orientation, and transition-continuity
checks only. All three are modern self-published media, not evidence of
historical performance, chronology, or technique. They are flagged as
operational media and excluded from corpus QA, embeddings, and claim extraction.
The synthetic 3D cadence does not reproduce source timing.

## Open-licensed image observations

The media evidence room also stores six screened Wikimedia Commons photographs.
Every card shows creator, date, license, source page, observation role, and the
limit of what the image can support. Local media hashes and rights decisions are
recorded in `data/research/media-register.json`.

- Ringer, “[Balisong open](https://commons.wikimedia.org/wiki/File:Balisong_open.jpg)”
  and “[Balisong closed](https://commons.wikimedia.org/wiki/File:Balisong_closed.jpg),”
  6 January 2016, CC BY-SA 4.0. These matched photographs support only visible
  contemporary open/closed appearance.
- Melchior22, “[BALING SUNGAY](https://commons.wikimedia.org/wiki/File:BALING_SUNGAY.jpg),”
  photographed 21 May 2021, CC BY-SA 4.0. Color, surface, and material appearance
  may be observed; the uploader's heritage narrative is not accepted as
  historical evidence.
- Iamthawalrus,
  “[ButterflyKnifeOpenandClosed](https://commons.wikimedia.org/wiki/File:ButterflyKnifeOpenandClosed.jpg),”
  8 May 2013, CC BY-SA 3.0. This supports a broad open/closed silhouette
  comparison without scale inference.
- Sasha Taylor,
  “[West Midlands Police Museum](https://commons.wikimedia.org/wiki/File:West_Midlands_Police_Museum_(13176531015).jpg),”
  15 March 2014, CC BY-SA 2.0. This is museum-display context only because the
  file page does not provide reviewed object-level catalogue metadata.
- Szilas,
  “[Balisong, made before 1982](https://commons.wikimedia.org/wiki/File:Balisong,_made_before_1982.jpg),”
  photographed 13 December 2025, CC BY 4.0. The apparent date is an uploader
  title claim without catalogue or provenance support. It is displayed as an
  unresolved lead and never dates a reconstruction preset.

Wikimedia thumbnails are local derivatives where the register says so. The
associated Creative Commons license applies to each third-party item; these
assets are not covered by the repository's MIT code license.

The contemporary appearance preset also uses Squid Industries'
“[Balisong Anatomy](https://www.squidindustries.co/blogs/education-squid-industries/balisong-anatomy)”
as a public visual-language reference. Only broad visible cues—slender overall
form, paired channel-style handles, surface slots, exposed pivot hardware, and
metal finish categories—were observed. Product imagery is neither bundled nor
reproduced, and no specific commercial model geometry is copied.

The regional external-form hypotheses cite the 1994 `Metalcraft` entry in the
*CCP Encyclopedia of Philippine Art*, made available through the National
Library of the Philippines. The linked entry supports horn appearance, metal
nail decoration, and named external form variants. The source PDF is linked for
research provenance and is not bundled or republished here.

The 1979–1994 industrial preset was visually checked against collector-hosted
scans of Bali-Song, Pacific Cutlery, and Benchmade catalogues at
[PBase](https://www.pbase.com/balisong/balisong_catalogs). The scans are treated
as rights-unknown linked reference material: no scan is copied into the project,
and the derived proxy uses only broad visible changes such as scale-clad versus
all-metal skeletonized handles.
