import type { BuildRowChunksOptions, TableChunk } from "../types/chunk";
import type { DocumentTable, TableCell } from "../types/table";
import { formatPageRange, joinSectionPath } from "../utils/text";
import { cellsForRow, sortRows } from "../utils/table";
import { createChunk } from "./shared";

const labelForCell = (table: DocumentTable, cell: TableCell): string => {
  const columnLabel = table.columns.find((column) => column.colIndex === cell.colIndex)?.label;
  const inferred = cell.inferredHeaders?.join(" > ");
  return inferred || columnLabel || `Column ${cell.colIndex + 1}`;
};

const serializeRow = (table: DocumentTable, rowIndex: number): { text: string; cells: TableCell[]; pages: number[] } => {
  const row = table.rows.find((candidate) => candidate.rowIndex === rowIndex);
  if (!row) {
    return { text: "", cells: [], pages: [] };
  }

  const cells = cellsForRow(table, row);
  const lines: string[] = [];

  if (table.title) {
    lines.push(`Table: ${table.title}`);
  }

  const section = joinSectionPath(table.sectionPath);
  if (section) {
    lines.push(`Section: ${section}`);
  }

  lines.push(`Page Range: ${formatPageRange(table.pages)}`);
  lines.push("");
  lines.push(`Row ${row.rowIndex}`);

  for (const cell of cells) {
    if (!cell.isHeader) {
      lines.push(`${labelForCell(table, cell)}: ${cell.textNormalized}`);
    }
  }

  const pages = [...new Set(cells.map((cell) => cell.page).filter((page): page is number => page !== undefined))];
  return {
    text: lines.join("\n"),
    cells,
    pages: pages.length > 0 ? pages : table.pages
  };
};

export const buildRowChunks = (
  table: DocumentTable,
  options: BuildRowChunksOptions = {}
): TableChunk[] =>
  sortRows(table.rows)
    .filter((row) => row.rowType !== "header" && row.rowType !== "note")
    .filter((row) => options.includeRepeatedHeaders || !row.repeatedHeaderRow)
    .map((row) => {
      const serialized = serializeRow(table, row.rowIndex);
      return createChunk(
        table,
        "row",
        row.rowIndex,
        serialized.text,
        [row.rowIndex],
        serialized.pages,
        serialized.cells
      );
    });
