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

```ts
import {
  buildNoteChunks,
  buildRowChunks,
  buildSummaryChunk,
  buildTableChunks,
  documentTableSchema,
  inferHeaders,
  mergeMultiPageTables,
  normalizeTable,
  safeValidateTable,
  tableChunkSchema,
  tableToHtml,
  tableToJson,
  tableToMarkdown,
  validateTable
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
```
