# table-preserving-doc-standard

`table-preserving-doc-standard` provides a canonical JSON table model for document ingestion workflows. It validates, normalizes, exports, and chunks extracted tables without treating Markdown as the source of truth.

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

## Public API

### Functions

```ts
import {
  // normalization
  normalizeTable,       // (input: unknown, opts?: NormalizeTableOptions) => DocumentTable
  inferHeaders,         // (table: DocumentTable) => DocumentTable
  mergeMultiPageTables, // (tables: DocumentTable[], opts?: MergeMultiPageTablesOptions) => DocumentTable[]
  // validation
  validateTable,        // (input: unknown) => DocumentTable  (throws on failure)
  safeValidateTable,    // (input: unknown) => { success: boolean; data?: DocumentTable; error?: ZodError }
  // export
  tableToHtml,          // (table: DocumentTable) => string
  tableToMarkdown,      // (table: DocumentTable) => MarkdownExportResult
  tableToJson,          // (table: DocumentTable) => JsonRecord
  // chunking
  buildTableChunks,     // (table: DocumentTable, opts?: BuildTableChunksOptions) => TableChunk[]
  buildRowChunks,       // (table: DocumentTable, opts?: BuildRowChunksOptions) => TableChunk[]
  buildRowGroupChunks,  // (table: DocumentTable, groupSize: number, opts?: BuildRowChunksOptions) => TableChunk[]
  buildSummaryChunk,    // (table: DocumentTable) => TableChunk
  buildNoteChunks,      // (table: DocumentTable) => TableChunk[]
} from "table-preserving-doc-standard";
```

### Schemas (Zod)

```ts
import {
  documentTableSchema,  // root schema — use with .parse() / .safeParse()
  tableCellSchema,
  tableRowSchema,
  tableColumnSchema,
  tableChunkSchema,
  headerGroupSchema,
  pageSpanSchema,
  continuitySchema,
  provenanceSchema,
  sourceRefSchema,
  boundingBoxSchema,
} from "table-preserving-doc-standard";
```

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
