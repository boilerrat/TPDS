export type {
  BuildRowChunksOptions,
  BuildTableChunksOptions,
  MarkdownExportResult,
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
export { buildRowGroupChunks, buildTableChunks } from "./chunk/build-table-chunks";
export { tableToHtml } from "./export/to-html";
export { tableToJson } from "./export/to-json";
export { tableToMarkdown } from "./export/to-markdown";
export { inferHeaders } from "./normalize/infer-headers";
export type { MergeMultiPageTablesOptions } from "./normalize/merge-multipage";
export { mergeMultiPageTables } from "./normalize/merge-multipage";
export type { NormalizeTableOptions } from "./normalize/normalize-table";
export { normalizeTable } from "./normalize/normalize-table";

import { documentTableSchema } from "./schema/zod";
import type { DocumentTable } from "./types/table";

export const validateTable = (input: unknown): DocumentTable => documentTableSchema.parse(input);

export const safeValidateTable = (input: unknown) => documentTableSchema.safeParse(input);
