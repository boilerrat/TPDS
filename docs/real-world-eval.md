# EPSCA Real-World Evaluation

This note records the current EPSCA-derived regression coverage in TPDS and the
starter plan for evaluating raw EPSCA PDFs before first npm publication.

## Source corpus

On April 19, 2026, EPSCA's public resources pages listed `Wage Schedule
Reference Guide.pdf`, trade-specific agreement PDFs, and wage-schedule-related
appendices:

- https://www.epsca.org/wage-schedules
- https://www.epsca.org/resources

## Current local regression corpus

Issue #60 added two curated fixtures derived from EPSCA wage schedule patterns:

| Local fixture | Representative EPSCA pattern | Primary stress points |
|---|---|---|
| `wage-schedule-colspan` | Wage schedule reference grids with grouped overtime columns | grouped headers, wide numeric grids, markdown fallback pressure |
| `wage-schedule-rowspan` | Trade/classification schedules found in collective agreement wage tables | `rowSpan`, dense currency columns, footnotes, repeated trade labels |

These fixtures are intentionally curated and reproducible. They are not raw PDF
dumps; they encode the semantics that TPDS needs to preserve when upstream
extractors encounter EPSCA-style tables.

## EPSCA starter PDF corpus

The first raw-PDF evaluation pass should use these five PDFs, as listed on the
EPSCA resources pages on April 19, 2026:

| PDF | Why it is in scope |
|---|---|
| `Wage Schedule Reference Guide.pdf` | Baseline compact reference document. It is the closest public source to the grouped-header wage schedule pattern already captured by `wage-schedule-colspan`. |
| `Appendix C Forepersons Rate MOA Update 2021- OE - FOR WEBSITE (2).pdf` | Small rate/update appendix that should act as a quick smoke test for compact wage-table extraction without the noise of a full agreement. |
| `BACU - 2025-2030 Collective Agreement.pdf` | A shorter full agreement to confirm the rubric works on an end-to-end agreement PDF before moving to the heaviest cases. |
| `Collective Agreement-Operating Engineers - May 1 2025 to April 30 2030.pdf` | Explicitly the table-heavy agreement to stress dense wage schedules, classification tables, repeated headers, and multi-page continuity. |
| `Teamsters - 2025 to 2030 Collective Agreement (1).pdf` | A second full-agreement family so release readiness is not judged on a single trade layout or one agreement template. |

This is intentionally a starter corpus, not the full EPSCA universe. The goal
is to decide whether TPDS is safe to publish first, then expand coverage later.

## What TPDS currently preserves well

- Header grouping survives in canonical JSON through `headerGroups` and
  merged-cell metadata.
- Dense wage tables retain row order, page references, units, captions, notes,
  and footnotes.
- HTML export preserves grouped and spanning structure for review-friendly
  rendering.
- Chunk generation keeps row-level wage data retrievable without flattening the
  full table into one blob.

## Known loss points

- Markdown export is intentionally lossy for these cases. Both fixtures trigger
  the structured fallback because merged cells and very wide grids cannot be
  represented faithfully as a simple pipe table.
- The local fixtures cover real-world table shape, not raw PDF extraction
  quality. OCR and extractor-specific breakage still need separate adapter-level
  evaluation against the starter PDF corpus above.

## Evaluation rubric

Score each PDF against the following dimensions. A first-publish pass means no
critical dimension fails on any starter PDF, and any non-critical lossiness is
explicitly documented.

| Dimension | What to check | First-publish expectation |
|---|---|---|
| Table detection coverage | Whether the wage tables that matter in the PDF are actually found and carried into TPDS JSON | No primary wage table is silently dropped. |
| Row/column structure preservation | Whether row order, column order, and numeric values survive normalization | No data-corrupting shifts, swaps, or collapsed rows. |
| Repeated-header handling | Whether continuation headers stay identifiable and do not pollute body rows or row chunks | No repeated page header should appear as a body record after normalization and chunking. |
| Multi-page merge correctness | Whether continuation pages merge into one logical table when they should | No silent split/merge errors on obvious continuation tables. |
| Merged-cell preservation | Whether grouped headers and span semantics remain visible in canonical JSON and HTML | No clearly merged wage-header structure is flattened without a warning. |
| Nested-header fidelity | Whether multi-level wage schedule headers remain understandable after normalization | Header hierarchy remains reviewable in JSON and HTML. |
| Notes and footnotes retention | Whether rate qualifiers, notes, and footnotes remain attached or clearly preserved | No critical qualifier is lost from the normalized representation. |
| HTML export usefulness | Whether a reviewer can inspect the output without going back to the PDF for basic table structure | HTML output is readable enough for visual verification. |
| Markdown fallback quality | Whether lossy cases are clearly marked and still usable when pipe tables are impossible | Lossy cases must include the structured fallback and fidelity warning. |
| Chunk usefulness | Whether row or row-group chunks still preserve enough context for retrieval/search | Sample chunks remain understandable without reopening the whole table. |
| Manual cleanup burden | How much human repair is needed after extraction and normalization | Minor notes are acceptable; manual reconstruction of a wage table is not. |

Use three outcome labels when recording a run:

- `pass`: meets the expectation with no material ambiguity
- `follow-up`: usable, but there is a non-critical gap worth tracking before the
  corpus expands
- `fail`: blocks first publish because it loses or corrupts important structure
  or values

## Run artifacts to save for each PDF

For every starter-corpus run, save or record:

- source PDF title and source URL
- access date and evaluator name
- extractor or adapter used, plus the command or script revision
- normalized TPDS JSON output
- HTML export
- Markdown export, including fidelity and warnings
- chunk output sample or full chunk JSON if practical
- short notes against the rubric above, including any `follow-up` or `fail`
  calls
- links to any issue opened from the run

## First npm publish release gate

TPDS is ready for its first npm publish only when all of the following are true:

- every PDF in the EPSCA starter corpus has at least one recorded evaluation run
- there are no known critical data-corruption or table-merge failures on that
  starter corpus
- expected lossy Markdown cases are documented as intentional, not accidental
- at least one evaluation summary is checked into `docs/`
- the highest-value EPSCA failure modes discovered during the run have been
  converted into local fixtures or regression tests where practical
- the normal repo release checks still pass: `npm run lint`, `npm test`, and
  `npm run build`

## Regression hooks in this repo

- Canonical inputs:
  `src/fixtures/wage-schedule-colspan.json`,
  `src/fixtures/wage-schedule-rowspan.json`
- Conformance snapshots:
  `src/fixtures/conformance/wage-schedule-colspan/`,
  `src/fixtures/conformance/wage-schedule-rowspan/`
- Coverage:
  - `src/__tests__/conformance.test.ts`
  - `src/__tests__/export-markdown.test.ts`

Future parser or export changes should be checked against these fixtures before
the starter PDF corpus is expanded again.
