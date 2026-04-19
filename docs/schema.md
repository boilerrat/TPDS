# Schema Reference

Full field-level reference for every type in `table-preserving-doc-standard`.

The authoritative source is [`src/schema/zod.ts`](../src/schema/zod.ts). The TypeScript types in [`src/types/`](../src/types/) mirror the Zod schemas — when they diverge, the Zod schemas win.

---

## DocumentTable

Root type. One `DocumentTable` represents one logical table, which may span multiple pages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `standardVersion` | `string` (min 1) | yes | Schema version string, e.g. `"1.0.0"` |
| `tableId` | `string` (min 1) | yes | Unique table identifier within the document |
| `sourceDocumentId` | `string` | no | Identifier of the source document |
| `sourceFileName` | `string` | no | Filename of the source document |
| `title` | `string` | no | Table title |
| `caption` | `string` | no | Table caption |
| `sectionPath` | `string[]` | no | Document section breadcrumb, e.g. `["Chapter 3", "Results"]` |
| `notes` | `string[]` | no | Inline notes attached to the table |
| `footnotes` | `string[]` | no | Footnotes referenced within the table |
| `pages` | `int[] (≥ 0)` | yes | Page numbers where this table appears (at least one) |
| `pageSpans` | `PageSpan[]` | no | Per-page bounding boxes |
| `columns` | `TableColumn[]` | yes | Column definitions |
| `rows` | `TableRow[]` | yes | Row definitions (header, body, footer, and note rows) |
| `cells` | `TableCell[]` | yes | All cells, looked up by `cellId` |
| `headerGroups` | `HeaderGroup[]` | no | Spanning header group definitions |
| `metadata` | `Record<string, unknown>` | no | Arbitrary extension metadata |
| `continuity` | `TableContinuity` | no | Multi-page continuity descriptor |
| `provenance` | `Provenance[]` | no | Ordered list of pipeline steps that produced this table |

---

## TableColumn

Describes one column. Columns are identified by `colIndex`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `colIndex` | `int (≥ 0)` | yes | Zero-based column index |
| `label` | `string` | no | Column header label |
| `inferredLabelPath` | `string[]` | no | Inferred header path for nested headers, e.g. `["Region", "North"]` |
| `units` | `string` | no | Unit of measure for column values, e.g. `"USD"` |
| `metadata` | `Record<string, unknown>` | no | Arbitrary extension metadata |

---

## TableRow

Describes one row. Rows reference cells by `cellId` rather than embedding them.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rowIndex` | `int (≥ 0)` | yes | Zero-based row index |
| `rowType` | `"header" \| "body" \| "footer" \| "note"` | no | Semantic role of this row |
| `cellIds` | `string[]` | yes | Ordered list of cell IDs in this row |
| `page` | `int (≥ 0)` | no | Page number where this row appears |
| `repeatedHeaderRow` | `boolean` | no | `true` if this is a repeated header on a continuation page; chunk builders skip these by default |

---

## TableCell

A single cell. Cells carry both raw and normalized text, span metadata, and optional provenance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cellId` | `string` (min 1) | yes | Unique cell ID. Convention: `{tableId}:{rowIndex}:{colIndex}` |
| `rowIndex` | `int (≥ 0)` | yes | Zero-based row index |
| `colIndex` | `int (≥ 0)` | yes | Zero-based column index |
| `textRaw` | `string` | yes | Verbatim extracted text |
| `textNormalized` | `string` | yes | Cleaned/normalized text |
| `isHeader` | `boolean` | no | Whether this cell is a header cell |
| `headerLevel` | `int (≥ 0)` | no | Nesting depth for hierarchical headers (`0` = top-most) |
| `rowSpan` | `int (≥ 1)` | no | Number of rows this cell spans (merged rows) |
| `colSpan` | `int (≥ 1)` | no | Number of columns this cell spans (merged columns) |
| `inferredHeaders` | `string[]` | no | Header labels inferred for this body cell by `inferHeaders` |
| `units` | `string` | no | Unit of measure for this cell's value |
| `valueType` | `"text" \| "number" \| "currency" \| "percent" \| "date" \| "boolean" \| "mixed"` | no | Semantic type of the cell value |
| `bbox` | `BoundingBox` | no | Bounding box of the cell in the source document |
| `page` | `int (≥ 0)` | no | Page number where this cell appears |
| `sourceRefs` | `SourceRef[]` | no | Source references for traceability |
| `metadata` | `Record<string, unknown>` | no | Arbitrary extension metadata |

---

## HeaderGroup

Represents a multi-column spanning header (e.g. a merged header cell that groups several columns).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | `string` (min 1) | yes | Unique identifier for this header group |
| `label` | `string` (min 1) | yes | Display label for the group |
| `level` | `int (≥ 0)` | yes | Nesting level (`0` = top-most spanning header) |
| `colStart` | `int (≥ 0)` | yes | First column index covered by this group (inclusive) |
| `colEnd` | `int (≥ 0)` | yes | Last column index covered by this group (inclusive) |

---

## TableContinuity

Describes how a table fragment relates to adjacent pages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isMultiPage` | `boolean` | yes | Whether this table spans multiple pages |
| `continuedFromPreviousPage` | `boolean` | no | Whether this fragment is a continuation of the table from the previous page |
| `continuesOnNextPage` | `boolean` | no | Whether this fragment continues onto the next page |
| `logicalTableGroupId` | `string` | no | Shared ID used to group fragments for `mergeMultiPageTables` |

---

## PageSpan

Locates a table fragment on a specific page, with an optional bounding box.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | `int (≥ 0)` | yes | Page number |
| `bbox` | `BoundingBox` | no | Bounding box of the table region on this page |

---

## BoundingBox

A rectangular region in a document coordinate space.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | `number` | yes | Left edge coordinate |
| `y` | `number` | yes | Top edge coordinate |
| `width` | `number` | yes | Width of the bounding region |
| `height` | `number` | yes | Height of the bounding region |
| `coordinateSpace` | `"pdf" \| "image" \| "normalized"` | no | Coordinate system in use |

---

## SourceRef

A reference back to the source document page and extraction tool.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | `int (≥ 0)` | yes | Source page number (0-based) |
| `extractor` | `string` | no | Name of the extraction tool |
| `extractorVersion` | `string` | no | Version of the extraction tool |
| `confidence` | `number [0, 1]` | no | Extraction confidence score |

---

## Provenance

One step in the pipeline that produced or transformed this table.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step` | `string` (min 1) | yes | Pipeline step name, e.g. `"docling-extraction"` |
| `tool` | `string` | no | Tool used in this step |
| `version` | `string` | no | Tool version |
| `timestamp` | `string` | no | ISO 8601 timestamp of this step |
| `notes` | `string` | no | Free-form notes about this step |

---

## TableChunk

A retrieval-ready text chunk derived from a `DocumentTable`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chunkId` | `string` (min 1) | yes | Unique chunk identifier |
| `tableId` | `string` (min 1) | yes | ID of the source table |
| `chunkType` | `"summary" \| "row" \| "row-group" \| "notes"` | yes | Kind of chunk |
| `text` | `string` | yes | Text content of the chunk, ready for embedding |
| `rowIndexes` | `int[] (≥ 0)` | yes | Row indexes covered by this chunk |
| `pages` | `int[] (≥ 0)` | yes | Pages covered by this chunk |
| `sectionPath` | `string[]` | no | Section path inherited from the source table |
| `title` | `string` | no | Table title, inherited from the source table |
| `caption` | `string` | no | Table caption, inherited from the source table |
| `tokenEstimate` | `int (≥ 0)` | yes | Estimated token count for `text` |
| `sourceRefs` | `SourceRef[]` | yes | Source references |
| `metadata` | `Record<string, unknown>` | no | Arbitrary extension metadata |

### Chunk types

| Type | Produced by | Content |
|------|-------------|---------|
| `"summary"` | `buildSummaryChunk` | Table title, section, page range, column names |
| `"row"` | `buildRowChunks` | One body row with inferred header context per cell |
| `"row-group"` | `buildRowGroupChunks` | N consecutive body rows batched into one chunk |
| `"notes"` | `buildNoteChunks` | Table notes and footnotes |
