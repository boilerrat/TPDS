# table-preserving-doc-standard

`table-preserving-doc-standard` provides a canonical JSON table model for document ingestion workflows. It validates, normalizes, exports, and chunks extracted tables without treating Markdown as the source of truth.

## Motivation

Document ingestion pipelines still break on tables. PDFs store visual layout, not semantic intent. When extraction tools flatten a table into plain text or weak Markdown, meaning gets damaged: rows lose their headers, merged cells lose structure, multi-page tables split into fragments, and footnotes detach from values. The result is that retrieval quality drops, answers get worse, and trust drops. Every RAG pipeline, compliance workflow, and document-aware AI system that processes PDFs inherits this damage if nothing in the pipeline preserves the table as a structured object.

This project defines a stable intermediate layer between extraction and retrieval. Upstream systems detect and extract. Downstream systems chunk, embed, index, and answer. `table-preserving-doc-standard` sits in the middle and preserves the table as a logical object with explicit relationships between headers, cells, rows, columns, notes, units, and source context. Markdown is treated as a derivative — useful for human inspection, not authoritative for complex tables with merged cells, nested headers, or page-spanning continuity. JSON is canonical. The schema is retrieval-aware from the start.

## What it covers

- canonical TypeScript and Zod schema
- normalization helpers for extracted table-like data
- multi-page table merge support
- header inference for body cells
- HTML export
- best-effort Markdown export
- retrieval chunk builders
- fixture-driven tests

## Install

```bash
npm install table-preserving-doc-standard
```

## Usage

```ts
import {
  buildTableChunks,
  mergeMultiPageTables,
  normalizeTable,
  tableToHtml,
  tableToMarkdown,
  validateTable
} from "table-preserving-doc-standard";

const table = normalizeTable({
  title: "Revenue by Quarter",
  sectionPath: ["Financial Results", "Q1 2025"],
  pages: [14, 15],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["h0", "h1"] },
    { rowIndex: 1, rowType: "body", cellIds: ["c0", "c1"] }
  ],
  columns: [{ colIndex: 0 }, { colIndex: 1 }],
  cells: [
    {
      cellId: "h0",
      rowIndex: 0,
      colIndex: 0,
      textRaw: "Quarter",
      textNormalized: "Quarter",
      isHeader: true
    },
    {
      cellId: "h1",
      rowIndex: 0,
      colIndex: 1,
      textRaw: "Revenue",
      textNormalized: "Revenue",
      isHeader: true
    },
    {
      cellId: "c0",
      rowIndex: 1,
      colIndex: 0,
      textRaw: "Q1 2025",
      textNormalized: "Q1 2025"
    },
    {
      cellId: "c1",
      rowIndex: 1,
      colIndex: 1,
      textRaw: "12.4M",
      textNormalized: "12.4M"
    }
  ]
});

validateTable(table);

const html = tableToHtml(table);
const markdown = tableToMarkdown(table);
const chunks = buildTableChunks(table);

console.log(html);
console.log(markdown.markdown);
console.log(chunks.map((chunk) => chunk.chunkType));

const merged = mergeMultiPageTables([table]);
console.log(merged.length);
```

## Chunking output

`buildTableChunks` returns one chunk per body row (plus a summary chunk). Each row chunk carries enough context for standalone retrieval. For the table above, the row chunk for row 1 looks like:

```
Table: Revenue by Quarter
Section: Financial Results > Q1 2025
Page Range: 14-15
Quarter: Q1 2025
Revenue: 12.4M
```

The `chunkType` is `"row"`, `rowIndexes` is `[1]`, and `tokenEstimate` counts the tokens in that text. The summary chunk captures the table-level context (title, columns, page range) without any row data.

## API Reference

### Functions

| Export | Signature | Description |
|--------|-----------|-------------|
| `normalizeTable` | `(input: unknown, opts?: NormalizeTableOptions) => DocumentTable` | Accepts raw/messy input, coerces fields defensively, and validates against the Zod schema |
| `inferHeaders` | `(table: DocumentTable) => DocumentTable` | Populates `inferredHeaders` on body cells by walking up the header rows |
| `mergeMultiPageTables` | `(tables: DocumentTable[], opts?: MergeMultiPageTablesOptions) => DocumentTable[]` | Groups fragments by `logicalTableGroupId` and merges them into one table per logical group |
| `validateTable` | `(input: unknown) => DocumentTable` | Validates input with `documentTableSchema.parse()`; throws `ZodError` on failure |
| `safeValidateTable` | `(input: unknown) => SafeParseReturnType<DocumentTable>` | Validates without throwing; returns `{ success, data, error }` |
| `tableToHtml` | `(table: DocumentTable) => string` | Exports as a `<table>` HTML string with `colspan`/`rowspan` attributes |
| `tableToMarkdown` | `(table: DocumentTable) => MarkdownExportResult` | Exports as pipe-table Markdown; `fidelity` is `"lossy"` when merged cells are present |
| `tableToJson` | `(table: DocumentTable) => JsonRecord` | Exports as a plain `Record<string, unknown>` |
| `buildTableChunks` | `(table: DocumentTable, opts?: BuildTableChunksOptions) => TableChunk[]` | Builds all chunk types in one call (summary + row/row-group + notes) |
| `buildRowChunks` | `(table: DocumentTable, opts?: BuildRowChunksOptions) => TableChunk[]` | Builds one `"row"` chunk per body row |
| `buildRowGroupChunks` | `(table: DocumentTable, groupSize: number, opts?: BuildRowChunksOptions) => TableChunk[]` | Batches N consecutive body rows into `"row-group"` chunks |
| `buildSummaryChunk` | `(table: DocumentTable) => TableChunk` | Builds a single `"summary"` chunk with title, section, page range, and column names |
| `buildNoteChunks` | `(table: DocumentTable) => TableChunk[]` | Builds `"notes"` chunks from `notes` and `footnotes` arrays |

### Schemas (Zod)

| Export | Description |
|--------|-------------|
| `documentTableSchema` | Root schema — use with `.parse()` / `.safeParse()` |
| `tableCellSchema` | Schema for `TableCell` |
| `tableRowSchema` | Schema for `TableRow` |
| `tableColumnSchema` | Schema for `TableColumn` |
| `tableChunkSchema` | Schema for `TableChunk` |
| `headerGroupSchema` | Schema for `HeaderGroup` |
| `pageSpanSchema` | Schema for `PageSpan` |
| `continuitySchema` | Schema for `TableContinuity` |
| `provenanceSchema` | Schema for `Provenance` |
| `sourceRefSchema` | Schema for `SourceRef` |
| `boundingBoxSchema` | Schema for `BoundingBox` |

### Types

```ts
import type {
  // core model
  DocumentTable,
  TableCell,
  TableRow,
  TableColumn,
  TableContinuity,
  HeaderGroup,
  PageSpan,
  // chunks
  TableChunk,
  TableChunkType,
  BuildTableChunksOptions,
  BuildRowChunksOptions,
  MarkdownExportResult,
  // shared primitives
  BoundingBox,
  CoordinateSpace,
  JsonRecord,
  Provenance,
  RowType,
  SourceRef,
  ValueType,
  // option bags
  NormalizeTableOptions,
  MergeMultiPageTablesOptions,
} from "table-preserving-doc-standard";
```

## Design notes

- JSON is the canonical representation.
- Markdown is derived and may be lossy.
- Merged cells, provenance, header context, and multi-page continuity are preserved in the schema.
- Row chunks skip repeated continuation headers by default.

## Development

```bash
npm install
npm run lint
npm test
npm run build
npm run smoke   # smoke-test ESM + CJS output against dist/
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full versioning policy and workflow.

### Publishing

Releases are published automatically when a `v*.*.*` tag is pushed. The
`.github/workflows/publish.yml` workflow runs lint, tests, build, and smoke
tests before calling `npm publish`.

To authorize the workflow you must add an **`NPM_TOKEN`** secret to the
repository (`Settings → Secrets and variables → Actions → New repository
secret`). Generate the token at npmjs.com under `Access Tokens → Granular
Access Token` with **Read and Write** permission for this package.

## Links

- [Schema reference](docs/schema.md) — field-level documentation for every type
- [Examples](docs/examples.md) — runnable TypeScript examples for normalize, merge, and export
- [Contributing](CONTRIBUTING.md) — branch naming, CI checks, fixture conventions, schema change rules
