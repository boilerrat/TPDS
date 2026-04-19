import type { BuildTableChunksOptions, TableChunk } from "../types/chunk";
import type { DocumentTable } from "../types/table";
import { sortRows } from "../utils/table";
import { buildNoteChunks } from "./build-note-chunks";
import { buildRowChunks } from "./build-row-chunks";
import { buildSummaryChunk } from "./build-summary-chunk";
import { createChunk } from "./shared";

export const buildRowGroupChunks = (
  table: DocumentTable,
  rowGroupSize = 5,
  includeRepeatedHeaders = false
): TableChunk[] => {
  const targetRows = sortRows(table.rows).filter(
    (row) =>
      row.rowType !== "header" &&
      row.rowType !== "note" &&
      (includeRepeatedHeaders || !row.repeatedHeaderRow)
  );

  const chunks: TableChunk[] = [];
  for (let index = 0; index < targetRows.length; index += rowGroupSize) {
    const group = targetRows.slice(index, index + rowGroupSize);
    const rowChunks = buildRowChunks(table, { includeRepeatedHeaders }).filter((chunk) =>
      group.some((row) => row.rowIndex === chunk.rowIndexes[0])
    );
    const text = rowChunks.map((chunk) => chunk.text).join("\n\n");
    const cells = table.cells.filter((cell) => group.some((row) => row.rowIndex === cell.rowIndex));
    const pages = [...new Set(group.map((row) => row.page).filter((page): page is number => page !== undefined))];
    chunks.push(
      createChunk(
        table,
        "row-group",
        `${group[0]?.rowIndex ?? index}-${group[group.length - 1]?.rowIndex ?? index}`,
        text,
        group.map((row) => row.rowIndex),
        pages.length > 0 ? pages : table.pages,
        cells,
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
    chunks.push(...buildRowGroupChunks(table, options.rowGroupSize ?? 5, options.includeRepeatedHeaders ?? false));
  }

  if (options.includeNotesChunk !== false) {
    chunks.push(...buildNoteChunks(table));
  }

  return chunks;
};
