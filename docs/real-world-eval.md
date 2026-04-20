# EPSCA Real-World Evaluation

This note records the current real-world-shaped regression corpus for TPDS and the document patterns it is intended to protect.

## Source corpus

On April 19, 2026, EPSCA's public resources pages listed both `Wage Schedule Reference Guide.pdf` and multiple 2025-2030 collective agreements:

- https://www.epsca.org/wage-schedules
- https://www.epsca.org/resources

The current local starter corpus is represented by two curated fixtures derived from those EPSCA wage schedule patterns:

| Local fixture | Representative EPSCA pattern | Primary stress points |
|---|---|---|
| `wage-schedule-colspan` | Wage schedule reference grids with grouped overtime columns | grouped headers, wide numeric grids, markdown fallback pressure |
| `wage-schedule-rowspan` | Trade/classification schedules found in collective agreement wage tables | `rowSpan`, dense currency columns, footnotes, repeated trade labels |

These fixtures are intentionally curated and reproducible. They are not raw PDF dumps; they encode the semantics that TPDS needs to preserve when upstream extractors encounter EPSCA-style tables.

## What TPDS currently preserves well

- Header grouping survives in canonical JSON through `headerGroups` and merged-cell metadata.
- Dense wage tables retain row order, page references, units, captions, notes, and footnotes.
- HTML export preserves grouped and spanning structure for review-friendly rendering.
- Chunk generation keeps row-level wage data retrievable without flattening the full table into one blob.

## Known loss points

- Markdown export is intentionally lossy for these cases. Both fixtures trigger the structured fallback because merged cells and very wide grids cannot be represented faithfully as a simple pipe table.
- These fixtures cover real-world table shape, not raw PDF extraction quality. OCR and extractor-specific breakage still needs separate adapter-level evaluation when new external corpora are added.

## Regression hooks in this repo

- Canonical inputs: `src/fixtures/wage-schedule-colspan.json`, `src/fixtures/wage-schedule-rowspan.json`
- Conformance snapshots: `src/fixtures/conformance/wage-schedule-colspan/`, `src/fixtures/conformance/wage-schedule-rowspan/`
- Coverage:
  - `src/__tests__/conformance.test.ts`
  - `src/__tests__/export-markdown.test.ts`

Future parser or export changes should be checked against these fixtures before broadening the EPSCA corpus further.
