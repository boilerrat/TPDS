export type {
  BuildRowChunksOptions,
  BuildTableChunksOptions,
  MarkdownExportResult,
  MarkdownWarning,
  TableChunk,
  TableChunkType
} from "./types/chunk";
export type {
  BoundingBox,
  CoordinateSpace,
  JsonRecord,
  Provenance,
  RowType,
  SourceRef,
  ValueType
} from "./types/common";
export type {
  DocumentTable,
  FidelityWarning,
  HeaderGroup,
  PageSpan,
  TableCell,
  TableColumn,
  TableContinuity,
  TableRow
} from "./types/table";
export {
  boundingBoxSchema,
  continuitySchema,
  documentTableSchema,
  fidelityWarningSchema,
  headerGroupSchema,
  pageSpanSchema,
  provenanceSchema,
  sourceRefSchema,
  tableCellSchema,
  tableChunkSchema,
  tableColumnSchema,
  tableRowSchema
} from "./schema/zod";
export { buildNoteChunks } from "./chunk/build-note-chunks";
export { buildRowChunks } from "./chunk/build-row-chunks";
export { buildSummaryChunk } from "./chunk/build-summary-chunk";
export type { BuildRowGroupChunksOptions } from "./chunk/build-table-chunks";
export { buildRowGroupChunks, buildTableChunks } from "./chunk/build-table-chunks";
export { tableToHtml } from "./export/to-html";
export { tableToJson } from "./export/to-json";
export { tableToMarkdown } from "./export/to-markdown";
export { addFidelityWarnings } from "./utils/fidelity-warnings";
export { inferHeaders } from "./normalize/infer-headers";
export type { MergeMultiPageTablesOptions } from "./normalize/merge-multipage";
export { mergeMultiPageTables } from "./normalize/merge-multipage";
export type { NormalizeTableOptions } from "./normalize/normalize-table";
export { normalizeTable } from "./normalize/normalize-table";
export type { FlatArrayAdapterOptions } from "./adapters/from-flat-array";
export { normalizeFromFlatArray } from "./adapters/from-flat-array";
export type { NormalizeDoclingOptions } from "./adapters/from-docling";
export { normalizeFromDocling } from "./adapters/from-docling";
export type { NormalizeMarkerOptions } from "./adapters/from-marker";
export { normalizeFromMarker } from "./adapters/from-marker";

import { documentTableSchema } from "./schema/zod";
import type { DocumentTable } from "./types/table";

/** Parses and validates input as a DocumentTable; throws ZodError on invalid input. */
export const validateTable = (input: unknown): DocumentTable => documentTableSchema.parse(input);

/** Validates input as a DocumentTable without throwing; returns a success/error discriminated union. */
export const safeValidateTable = (
  input: unknown
): ReturnType<typeof documentTableSchema.safeParse> =>
  documentTableSchema.safeParse(input);

export { default as documentTableJsonSchema } from "./schema/json-schema.json";
