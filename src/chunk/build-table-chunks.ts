import type { BuildRowChunksOptions, BuildTableChunksOptions, TableChunk } from "../types/chunk";
import type { DocumentTable } from "../types/table";
import { cellsById, sortRows } from "../utils/table";
import { buildNoteChunks } from "./build-note-chunks";
import { buildRowChunks } from "./build-row-chunks";
import { buildSummaryChunk } from "./build-summary-chunk";
import { createChunk } from "./shared";

export type BuildRowGroupChunksOptions = BuildRowChunksOptions & {
  rowGroupSize?: number;
};

export const buildRowGroupChunks = (
  table: DocumentTable,
  options: BuildRowGroupChunksOptions = {}
): TableChunk[] => {
  const { rowGroupSize = 5, includeRepeatedHeaders = false } = options;

  if (rowGroupSize < 1) {
    throw new RangeError(`buildRowGroupChunks: rowGroupSize must be >= 1, got ${rowGroupSize}`);
  }

  const targetRows = sortRows(table.rows).filter(
    (row) =>
      row.rowType !== "header" &&
      row.rowType !== "footer" &&
      row.rowType !== "note" &&
      (includeRepeatedHeaders || !row.repeatedHeaderRow)
  );

  const allRowChunks = buildRowChunks(table, { includeRepeatedHeaders });
  const rowChunkByIndex = new Map(allRowChunks.map((chunk) => [chunk.rowIndexes[0], chunk]));
  const cellMap = cellsById(table);

  const chunks: TableChunk[] = [];
  for (let index = 0; index < targetRows.length; index += rowGroupSize) {
    const group = targetRows.slice(index, index + rowGroupSize);
    const groupIndexSet = new Set(group.map((row) => row.rowIndex));
    const rowChunks = group
      .map((row) => rowChunkByIndex.get(row.rowIndex))
      .filter((chunk): chunk is TableChunk => chunk !== undefined);
    const text = rowChunks.map((chunk) => chunk.text).join("\n\n");
    const cells = table.cells.filter((cell) => groupIndexSet.has(cell.rowIndex));
    const cellsWithMap = group
      .flatMap((row) => row.cellIds.map((id) => cellMap.get(id)))
      .filter((cell): cell is NonNullable<typeof cell> => cell !== undefined);
    const pages = [...new Set(group.map((row) => row.page).filter((page): page is number => page !== undefined))];
    chunks.push(
      createChunk(
        table,
        "row-group",
        `${group[0]?.rowIndex ?? index}-${group[group.length - 1]?.rowIndex ?? index}`,
        text,
        group.map((row) => row.rowIndex),
        pages.length > 0 ? pages : table.pages,
        cells.length > 0 ? cells : cellsWithMap,
        { rowGroupSize }
      )
    );
  }

  return chunks;
};

export const buildTableChunks = (
  table: DocumentTable,
  options: BuildTableChunksOptions = {}
): TableChunk[] => {
  const chunks: TableChunk[] = [];

  if (options.includeSummaryChunk !== false) {
    chunks.push(buildSummaryChunk(table));
  }

  if (options.includeRowChunks !== false) {
    chunks.push(...buildRowChunks(table, options));
  }

  if (options.includeRowGroupChunks !== false) {
    chunks.push(...buildRowGroupChunks(table, {
      rowGroupSize: options.rowGroupSize ?? 5,
      includeRepeatedHeaders: options.includeRepeatedHeaders ?? false
    }));
  }

  if (options.includeNotesChunk !== false) {
    chunks.push(...buildNoteChunks(table));
  }

  return chunks;
};
