# Examples

Three runnable examples covering the core workflows. Each snippet is self-contained and can be run with:

```bash
npx tsx examples/<file>.ts
```

All examples import from the published package. If running from this repo you can swap the import path to `"../src/index.js"`.

---

## Example 1 — Raw extraction output → normalize → chunk

**Why this matters.** Real-world extraction tools (Docling, Marker, custom OCR pipelines) produce messy JSON with inconsistent field names, missing IDs, or partial metadata. `normalizeTable` accepts that raw input, coerces every field defensively, rebuilds cell IDs, infers missing page numbers, and validates the result against the Zod schema — giving downstream code a single, stable shape regardless of which extractor produced the data. `buildTableChunks` then turns that normalized table into retrieval-ready text chunks.

```typescript
// examples/01-normalize-and-chunk.ts
import { buildTableChunks, normalizeTable } from "table-preserving-doc-standard";

// Simulate Docling-style raw extraction output — no tableId, no standardVersion,
// cell IDs match the extractor's internal convention.
const raw = {
  title: "Revenue by Quarter",
  sectionPath: ["Financial Results", "Q1 2025"],
  pages: [14],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["h0", "h1"] },
    { rowIndex: 1, rowType: "body",   cellIds: ["c0", "c1"] },
    { rowIndex: 2, rowType: "body",   cellIds: ["c2", "c3"] },
  ],
  columns: [{ colIndex: 0 }, { colIndex: 1 }],
  cells: [
    { cellId: "h0", rowIndex: 0, colIndex: 0, textRaw: "Quarter",  textNormalized: "Quarter",  isHeader: true },
    { cellId: "h1", rowIndex: 0, colIndex: 1, textRaw: "Revenue",  textNormalized: "Revenue",  isHeader: true },
    { cellId: "c0", rowIndex: 1, colIndex: 0, textRaw: "Q1 2025",  textNormalized: "Q1 2025" },
    { cellId: "c1", rowIndex: 1, colIndex: 1, textRaw: "12.4M",    textNormalized: "12.4M",    valueType: "currency" },
    { cellId: "c2", rowIndex: 2, colIndex: 0, textRaw: "Q2 2025",  textNormalized: "Q2 2025" },
    { cellId: "c3", rowIndex: 2, colIndex: 1, textRaw: "15.1M",    textNormalized: "15.1M",    valueType: "currency" },
  ],
};

const table = normalizeTable(raw);
const chunks = buildTableChunks(table);

for (const chunk of chunks) {
  console.log(`\n--- [${chunk.chunkType}] rows=${JSON.stringify(chunk.rowIndexes)} ---`);
  console.log(chunk.text);
}
```

Expected output (abbreviated):

```
--- [summary] rows=[] ---
Table: Revenue by Quarter
Section: Financial Results > Q1 2025
Page Range: 14
Columns: Quarter, Revenue

--- [row] rows=[1] ---
Table: Revenue by Quarter
...
Quarter: Q1 2025
Revenue: 12.4M

--- [row] rows=[2] ---
...
```

---

## Example 2 — Two page fragments → merge → inspect merged table

**Why this matters.** PDFs frequently split a single logical table across pages. Each extractor fragment arrives as its own `DocumentTable`. `mergeMultiPageTables` groups fragments by `continuity.logicalTableGroupId` (falling back to matching title + columns, then `tableId`), reindexes rows and cells from the continuation page so indexes don't collide, removes repeated header rows, and returns one merged `DocumentTable` per logical table.

```typescript
// examples/02-merge-multipage.ts
import { mergeMultiPageTables, normalizeTable } from "table-preserving-doc-standard";

// Page 5 — first fragment
const page5 = normalizeTable({
  tableId: "shipments-p5",
  title: "Shipment Delays by Port",
  pages: [5],
  columns: [{ colIndex: 0, label: "Port" }, { colIndex: 1, label: "Delay" }],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["h0", "h1"], page: 5 },
    { rowIndex: 1, rowType: "body",   cellIds: ["r1c0", "r1c1"], page: 5 },
  ],
  cells: [
    { cellId: "h0",   rowIndex: 0, colIndex: 0, textRaw: "Port",    textNormalized: "Port",    isHeader: true },
    { cellId: "h1",   rowIndex: 0, colIndex: 1, textRaw: "Delay",   textNormalized: "Delay",   isHeader: true },
    { cellId: "r1c0", rowIndex: 1, colIndex: 0, textRaw: "Halifax",  textNormalized: "Halifax" },
    { cellId: "r1c1", rowIndex: 1, colIndex: 1, textRaw: "3 days",   textNormalized: "3 days" },
  ],
  continuity: {
    isMultiPage: true,
    continuesOnNextPage: true,
    logicalTableGroupId: "shipments-delays",
  },
});

// Page 6 — continuation fragment with repeated header row
const page6 = normalizeTable({
  tableId: "shipments-p6",
  title: "Shipment Delays by Port",
  pages: [6],
  columns: [{ colIndex: 0, label: "Port" }, { colIndex: 1, label: "Delay" }],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["h2", "h3"], page: 6 },
    { rowIndex: 1, rowType: "body",   cellIds: ["r2c0", "r2c1"], page: 6 },
  ],
  cells: [
    { cellId: "h2",   rowIndex: 0, colIndex: 0, textRaw: "Port",     textNormalized: "Port",     isHeader: true },
    { cellId: "h3",   rowIndex: 0, colIndex: 1, textRaw: "Delay",    textNormalized: "Delay",    isHeader: true },
    { cellId: "r2c0", rowIndex: 1, colIndex: 0, textRaw: "Montreal", textNormalized: "Montreal" },
    { cellId: "r2c1", rowIndex: 1, colIndex: 1, textRaw: "5 days",   textNormalized: "5 days" },
  ],
  continuity: {
    isMultiPage: true,
    continuedFromPreviousPage: true,
    logicalTableGroupId: "shipments-delays",
  },
});

const merged = mergeMultiPageTables([page5, page6]);

console.log("Merged table count:", merged.length);          // 1
const [table] = merged;
console.log("Pages:", table.pages);                         // [5, 6]
console.log("Total rows:", table.rows.length);              // header + 2 body rows
console.log("Total cells:", table.cells.length);

// The repeated header from page 6 is detected automatically.
const repeated = table.rows.filter((r) => r.repeatedHeaderRow);
console.log("Repeated header rows removed from chunks:", repeated.length); // 1
```

---

## Example 3 — Merged-cell table → HTML and Markdown export, explain `isLossy`

**Why this matters.** Tables with merged cells (`rowSpan`/`colSpan`) carry structural information that Markdown pipe tables cannot represent. `tableToHtml` produces a fully-faithful `<table>` with `colspan` and `rowspan` attributes. `tableToMarkdown` produces the most readable Markdown it can, but sets `fidelity: "lossy"` and populates `warnings` so callers know the export has lost structure. This distinction matters for downstream consumers: use HTML when round-tripping or rendering, use Markdown only for inspection and previews.

```typescript
// examples/03-export-merged-cells.ts
import { normalizeTable, tableToHtml, tableToMarkdown } from "table-preserving-doc-standard";

// Table: "Employee Counts by Department"
// Row 0: merged header cell "Department" (rowSpan=2) + "Headcount" (colSpan=2)
// Row 1: sub-headers "" | "Full Time" | "Contract"
// Row 2: body row  "Engineering" | 82 | 14
const raw = {
  tableId: "merged-cells-table",
  title: "Employee Counts by Department",
  caption: "Department totals with merged top-level grouping headers.",
  pages: [8],
  columns: [
    { colIndex: 0, label: "Department" },
    { colIndex: 1, label: "Full Time" },
    { colIndex: 2, label: "Contract" },
  ],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["g0", "g1"],         page: 8 },
    { rowIndex: 1, rowType: "header", cellIds: ["h0", "h1", "h2"],   page: 8 },
    { rowIndex: 2, rowType: "body",   cellIds: ["r2c0", "r2c1", "r2c2"], page: 8 },
  ],
  cells: [
    { cellId: "g0",   rowIndex: 0, colIndex: 0, textRaw: "Department", textNormalized: "Department", isHeader: true, rowSpan: 2 },
    { cellId: "g1",   rowIndex: 0, colIndex: 1, textRaw: "Headcount",  textNormalized: "Headcount",  isHeader: true, colSpan: 2 },
    { cellId: "h0",   rowIndex: 1, colIndex: 0, textRaw: "",           textNormalized: "",            isHeader: true },
    { cellId: "h1",   rowIndex: 1, colIndex: 1, textRaw: "Full Time",  textNormalized: "Full Time",   isHeader: true },
    { cellId: "h2",   rowIndex: 1, colIndex: 2, textRaw: "Contract",   textNormalized: "Contract",    isHeader: true },
    { cellId: "r2c0", rowIndex: 2, colIndex: 0, textRaw: "Engineering",textNormalized: "Engineering" },
    { cellId: "r2c1", rowIndex: 2, colIndex: 1, textRaw: "82",         textNormalized: "82",          valueType: "number" },
    { cellId: "r2c2", rowIndex: 2, colIndex: 2, textRaw: "14",         textNormalized: "14",          valueType: "number" },
  ],
  headerGroups: [
    { groupId: "headcount", label: "Headcount", level: 0, colStart: 1, colEnd: 2 },
  ],
  continuity: { isMultiPage: false },
};

const table = normalizeTable(raw);

// HTML export — fully faithful, preserves colspan/rowspan
const html = tableToHtml(table);
console.log("=== HTML ===");
console.log(html);

// Markdown export — best-effort, may be lossy
const { markdown, fidelity, warnings } = tableToMarkdown(table);
console.log("\n=== Markdown ===");
console.log(markdown);
console.log("\nFidelity:", fidelity);   // "lossy" — merged cells cannot round-trip through pipe syntax
console.log("Warnings:", warnings);    // describes which cells lost their span information
```

The `fidelity` field is `"lossless"` only when every cell has `rowSpan ≤ 1` and `colSpan ≤ 1`. Treat any `"lossy"` Markdown export as a human-readable preview, not a source of truth.
