# Literature register and collection notes

Updated: 2026-09-01

This is a research-acquisition register, not a published history. No title in
this list becomes evidence merely because it is old, digitized, institutional,
or highly ranked. Claim-level use still requires a saved page or image region,
rights review, sensitive-content screening, and human acceptance.

## Discovery priority

The collector uses the following discovery order:

1. archives, contemporary records, museum catalogues, and institutional object records;
2. books and scholarly museum publications;
3. period publications and academic papers or theses;
4. institutional web records;
5. independently published web posts and transcriptions.

This implements the working preference **web post < paper < book**, while
keeping source format separate from truth. A recent article may correct an old
book; an early catalogue may repeat received knowledge; several reposts may be
one dependent source family.

## Direct and high-priority leads

| Year | Source | Access in this checkout | Evaluation state |
|---|---|---|---|
| 1880 | Edmund Jansen, *Clasp-Knife*, US Patent 229,706 | Metadata only | Comparative primary record. Mechanically detailed; excluded from AI and public search. It does not demonstrate Philippine origin. |
| 1895 | Manuel Sastrón, *Filipinas: pequeños estudios; Batangas y su provincia* | Private research copy | Contemporary regional book. Page-level relevance has not yet been established. |
| 1903 | *Official handbook of the Philippines and catalogue of the Philippine exhibit* | Private research copy | Period government catalogue for institutional and material-culture context. |
| 1904 | *Official catalogue, Philippine exhibits, Universal Exposition, St. Louis* | Private research copy | Period catalogue; requires provenance and bias review. |
| 1905 | *Census of the Philippine Islands* (four-volume scan set) | Private research copies | Official statistical and regional context; not a direct design history. |
| 1905 | A. E. Jenks, *The Bontoc Igorot* | Private research copy | Ethnographic context; requires critical reading of colonial method and terminology. |
| 1905/1907 | James A. LeRoy, *Philippine Life in Town and Country* | Private research copy | Social context; not assumed to document the exhibition subject. |
| 1906 | John Foreman, *The Philippine Islands* | Private research copy | Broad historical context; source dependence and authorial position require review. |
| 1912 | *Philippine Craftsman* (22 digitized issues) | Private research copies | Contemporary craft/industry periodical sequence, retained for issue-level search and review. |
| 1913 | Fay-Cooper Cole, *The Wild Tribes of Davao District, Mindanao* | Private research copy | Regional ethnographic context; not direct balisong evidence. |
| 1914 | Dean C. Worcester, *The Philippines Past and Present* | Private research copy | Broad historical context with significant authorial/colonial bias to evaluate. |
| 1926 | Herbert W. Krieger, *The Collection of Primitive Weapons and Armor of the Philippine Islands in the United States National Museum* | Private research copy requested | Museum monograph. It contains controlled measurements and technical description and remains excluded from AI/public search. |
| 1946–1951 | *Historical data for the province of Batangas* | Institutional catalogue metadata | Retrospective local-history compilation. It cannot be treated as contemporary evidence for earlier dates. |
| 1994 | “Metalcraft,” *CCP Encyclopedia of Philippine Art, Visual Arts* | Private restricted research copy | Direct craft context and bibliography; copyright and controlled-content flags are pending review. |
| 2002 | Ramon N. Villegas, ed., *Batangas: Forged in Fire* | Catalogue metadata | Regional secondary-source lead; no digital copy was offered by the catalogue. |
| 2016 | Daniel John Felix G. Galvan, *Ang balisong bilang sagisag-kultura…* | Institutional thesis metadata | Direct cultural-research lead. Full text was not publicly downloadable. |

The expanded private corpus also includes six Philippine Commission report
volumes, ten annual volumes of *The Philippine Journal of Science* (1908–1919
selection), early economic and commercial surveys, and historical works on
Philippine law, folklore, language, social life, and ethnography. These provide
context and vocabulary for later page-level research; none is treated as a
verified statement about the exhibition subject merely because it is old.

## Contextual institutional records

- [Smithsonian repository record for USNM Bulletin 137](https://repository.si.edu/items/c2f4a202-42a1-40bc-bb49-3b665785ff39)
- [The Metropolitan Museum of Art, Luzon object record 317185](https://www.metmuseum.org/art/collection/search/317185)
- [French Ministry of Culture, Musée de la Coutellerie record](https://pop.culture.gouv.fr/notice/museo/M0129)
- [Philippine eLib catalogue: Historical data for Batangas](https://www.elib.gov.ph/details.php?uid=c62d892e4b1d809c4a4a339d55e3d021)
- [DLSU institutional thesis record](https://animorepository.dlsu.edu.ph/etd_bachelors/2831/)

The Thiers record is an institutional contact/collection lead. It does not by
itself verify popular “French origin” narratives. The Met object record supplies
regional material-culture context; it is not identified here as a balisong.

## Web material

Web transcriptions and collector histories are retained only as discovery and
source-lineage leads. They remain Tier D until their statements can be traced to
an archival or scholarly source. The project does not count a transcription and
its archival original as two independent sources.

The Batangas History transcription is particularly controlled: its page can
help locate the National Library local-history collection, but its operational
and manufacturing passages are not copied, embedded, or placed in public search.

## Storage and safety status

`scripts/collect_literature.py` creates:

- `data/research/bibliography.json`: tracked bibliographic metadata and policy state;
- `data/research/download-report.json`: tracked actual hashes, byte counts, failures, and CAS keys;
- `data/storage/research/sha256/<prefix>/<sha256>.pdf`: ignored private research copies.

Every collected file starts with:

- `sensitive_review_status: pending`;
- `public_display_allowed: false`;
- `excluded_from_ai: true`;
- `excluded_from_embeddings: true`;
- `excluded_from_public_search: true`.

Collection therefore does not automatically ingest, OCR, quote, publish, or send
a file to a model. A rights decision and sensitive-content review are separate,
recorded actions.

### Actual collection snapshot

The 2026-09-01 expanded run catalogued **85 records** and placed **76 PDF
research copies** in private CAS storage, totalling **1,781,829,481 bytes**
(about 1.66 GiB). This second collection pass added **39 scanned volumes**,
weighted toward old books, official records, and historical periodicals rather
than web posts. The tracked
download report contains the actual SHA-256 and byte count for every available
copy. The original Smithsonian endpoint returned HTTP 403 to the collector, so
the public-domain USNM Bulletin 137 scan was obtained from Wikimedia Commons;
the canonical Smithsonian record and DOI remain the bibliographic authority.

## Reproducible collection command

```bash
make collect-literature
```

The downloader accepts only a fixed HTTPS host allow-list, has a per-item size
ceiling, records failures instead of hiding them, and stores content by SHA-256.
Restricted/loan-only books are catalogue metadata only; the collector does not
use unauthorized mirrors or evade institutional access controls.

## Research gaps

1. Obtain the full DLSU thesis through an authorized institutional channel.
2. Compare the National Library Batangas microfilm with online transcriptions.
3. Request object-level records from Taal/Batangas institutions and the Thiers museum.
4. Screen and search the 22 *Philippine Craftsman* issues and ten selected
   *Philippine Journal of Science* volumes at page level.
5. Audit the citation lineage of recurring origin dates before proposing any chronology claim.
