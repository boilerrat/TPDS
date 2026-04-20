import { z } from "zod";

const jsonRecordSchema = z.record(z.string(), z.unknown());

export const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  coordinateSpace: z.enum(["pdf", "image", "normalized"]).optional()
});

export const sourceRefSchema = z.object({
  page: z.number().int().nonnegative(),
  extractor: z.string().optional(),
  extractorVersion: z.string().optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const provenanceSchema = z.object({
  step: z.string().min(1),
  tool: z.string().optional(),
  version: z.string().optional(),
  timestamp: z.string().optional(),
  notes: z.string().optional()
});

export const tableColumnSchema = z.object({
  colIndex: z.number().int().nonnegative(),
  label: z.string().optional(),
  inferredLabelPath: z.array(z.string()).optional(),
  units: z.string().optional(),
  metadata: jsonRecordSchema.optional()
});

export const headerGroupSchema = z.object({
  groupId: z.string().min(1),
  label: z.string().min(1),
  level: z.number().int().nonnegative(),
  colStart: z.number().int().nonnegative(),
  colEnd: z.number().int().nonnegative()
});

export const tableCellSchema = z.object({
  cellId: z.string().min(1),
  rowIndex: z.number().int().nonnegative(),
  colIndex: z.number().int().nonnegative(),
  textRaw: z.string(),
  textNormalized: z.string(),
  isHeader: z.boolean().optional(),
  headerLevel: z.number().int().nonnegative().optional(),
  rowSpan: z.number().int().positive().optional(),
  colSpan: z.number().int().positive().optional(),
  inferredHeaders: z.array(z.string()).optional(),
  units: z.string().optional(),
  valueType: z
    .enum(["text", "number", "currency", "percent", "date", "boolean", "mixed"])
    .optional(),
  bbox: boundingBoxSchema.optional(),
  page: z.number().int().nonnegative().optional(),
  sourceRefs: z.array(sourceRefSchema).optional(),
  metadata: jsonRecordSchema.optional()
});

export const tableRowSchema = z.object({
  rowIndex: z.number().int().nonnegative(),
  rowType: z.enum(["header", "body", "footer", "note"]).optional(),
  cellIds: z.array(z.string().min(1)),
  page: z.number().int().nonnegative().optional(),
  repeatedHeaderRow: z.boolean().optional()
});

export const pageSpanSchema = z.object({
  page: z.number().int().nonnegative(),
  bbox: boundingBoxSchema.optional()
});

export const continuitySchema = z.object({
  isMultiPage: z.boolean(),
  continuedFromPreviousPage: z.boolean().optional(),
  continuesOnNextPage: z.boolean().optional(),
  logicalTableGroupId: z.string().optional()
});

export const fidelityWarningSchema = z.enum([
  "merged-cells-present",
  "headers-inferred",
  "markdown-lossy",
  "repeated-headers-detected",
  "ocr-noise-suspected",
  "multi-page-merged",
  "jagged-rows-detected"
]);

export const documentTableSchema = z.object({
  standardVersion: z.string().min(1),
  tableId: z.string().min(1),
  sourceDocumentId: z.string().optional(),
  sourceFileName: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  sectionPath: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
  footnotes: z.array(z.string()).optional(),
  pages: z.array(z.number().int().nonnegative()),
  pageSpans: z.array(pageSpanSchema).optional(),
  columns: z.array(tableColumnSchema),
  rows: z.array(tableRowSchema),
  cells: z.array(tableCellSchema),
  headerGroups: z.array(headerGroupSchema).optional(),
  metadata: jsonRecordSchema.optional(),
  continuity: continuitySchema.optional(),
  provenance: z.array(provenanceSchema).optional(),
  fidelityWarnings: z.array(fidelityWarningSchema).optional()
});

export const tableChunkSchema = z.object({
  chunkId: z.string().min(1),
  tableId: z.string().min(1),
  chunkType: z.enum(["summary", "row", "row-group", "notes"]),
  text: z.string(),
  rowIndexes: z.array(z.number().int().nonnegative()),
  pages: z.array(z.number().int().nonnegative()),
  sectionPath: z.array(z.string()).optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  tokenEstimate: z.number().int().nonnegative(),
  sourceRefs: z.array(sourceRefSchema),
  metadata: jsonRecordSchema.optional()
});
