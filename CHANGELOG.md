# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - Unreleased

### Added

- **Zod schema** (`src/schema/zod.ts`): canonical `documentTableSchema` with
  `TableCell`, `TableRow`, `TableColumn`, `TableContinuity`, and `DocumentTable`
  shapes. `tableChunkSchema` and discriminated union for all chunk types.
- **TypeScript types** (`src/types/`): `DocumentTable`, `TableCell`, `TableRow`,
  `TableColumn`, `TableContinuity`, `TableChunk`, and related types inferred
  from or mirrored against the Zod schemas.
- **`normalizeTable`** (`src/normalize/normalize-table.ts`): two-phase
  normalization — hand-written guard helpers coerce messy/unknown input, then
  `documentTableSchema.parse()` validates the result. Assigns stable `cellId`s
  in `{tableId}:{rowIndex}:{colIndex}` format.
- **`inferHeaders`** (`src/normalize/infer-headers.ts`): heuristic header
  inference for tables where no explicit header row is marked.
- **`mergeMultiPageTables`** (`src/normalize/merge-multipage.ts`): groups tables
  by `continuity.logicalTableGroupId` → title+columns → `tableId` fallback,
  offsets row and cell indexes of continuation pages, and merges rows/cells into
  a single `DocumentTable`.
- **`buildTableChunks`** (`src/chunk/build-table-chunks.ts`): orchestrates all
  chunk builders and returns a flat array of typed chunks.
- **`buildSummaryChunk`** (`src/chunk/build-summary-chunk.ts`): produces a
  `summary` chunk with table-level metadata.
- **`buildRowChunks`** / **row-group chunking** (`src/chunk/build-row-chunks.ts`):
  produces one `row` chunk per body row or batched `row-group` chunks. Detects
  and skips repeated continuation headers by default.
- **`buildNoteChunks`** (`src/chunk/build-note-chunks.ts`): produces `notes`
  chunks from any annotated note rows.
- **`tableToHtml`** (`src/export/to-html.ts`): renders a `DocumentTable` to an
  HTML `<table>` string preserving header rows and merged-cell intent.
- **`tableToMarkdown`** (`src/export/to-markdown.ts`): best-effort Markdown
  table export; lossy for merged cells.
- **`tableToJson`** (`src/export/to-json.ts`): serialises a `DocumentTable` to
  a plain JSON-serialisable object.
- **Utility helpers** (`src/utils/`): `guards.ts` (type-guard helpers used by
  normalizeTable), `ids.ts` (cellId helpers), `text.ts` (text normalisation),
  `table.ts` (column sorting helpers).
- **Public barrel** (`src/index.ts`): single entry point re-exporting all
  public API symbols.
- **Dual ESM + CJS build** via `tsup`; `.d.ts` declarations included.

### Changed

- Nothing yet — initial release.

### Deprecated

- Nothing yet.

### Removed

- Nothing yet.

### Fixed

- Nothing yet.

### Security

- Nothing yet.

[Unreleased]: https://github.com/boilerrat/TPDS/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/boilerrat/TPDS/releases/tag/v0.1.0
