import type { TableChunk, TableChunkType } from "../types/chunk";
import type { DocumentTable, TableCell } from "../types/table";
import { createChunkId } from "../utils/ids";
import { estimateTokens } from "../utils/text";
import { collectSourceRefs } from "../utils/table";

export const createChunk = (
  table: DocumentTable,
  chunkType: TableChunkType,
  suffix: string | number,
  text: string,
  rowIndexes: number[],
  pages: number[],
  cells: TableCell[],
  metadata?: Record<string, unknown>
): TableChunk => ({
  chunkId: createChunkId(table.tableId, chunkType, suffix),
  tableId: table.tableId,
  chunkType,
  text,
  rowIndexes,
  pages,
  sectionPath: table.sectionPath,
  title: table.title,
  caption: table.caption,
  tokenEstimate: estimateTokens(text),
  sourceRefs: collectSourceRefs(cells),
  metadata
});
