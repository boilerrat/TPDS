import type { DocumentTable, TableCell, TableRow } from "../types/table";
import { cellsForRow, sortRows } from "../utils/table";

const spansColumn = (cell: TableCell, colIndex: number): boolean => {
  const colSpan = cell.colSpan ?? 1;
  return colIndex >= cell.colIndex && colIndex < cell.colIndex + colSpan;
};

const rowIsHeader = (table: DocumentTable, row: TableRow): boolean => {
  if (row.rowType === "header" || row.repeatedHeaderRow) {
    return true;
  }

  const cells = cellsForRow(table, row);
  return cells.length > 0 && cells.every((cell) => cell.isHeader);
};

export const inferHeaders = (table: DocumentTable): DocumentTable => {
  const sortedRows = sortRows(table.rows);
  const headerRows = sortedRows.filter((row) => rowIsHeader(table, row));
  const nextCells = table.cells.map((cell) => {
    if (cell.isHeader) {
      return cell;
    }

    const inferred = new Set<string>();

    for (const headerRow of headerRows) {
      if (headerRow.rowIndex >= cell.rowIndex && !headerRow.repeatedHeaderRow) {
        continue;
      }

      for (const headerCell of cellsForRow(table, headerRow)) {
        if (headerCell.isHeader && spansColumn(headerCell, cell.colIndex) && headerCell.textNormalized) {
          inferred.add(headerCell.textNormalized);
        }
      }
    }

    const sameRowHeaderCells = table.cells
      .filter(
        (candidate) =>
          candidate.rowIndex === cell.rowIndex &&
          candidate.colIndex < cell.colIndex &&
          candidate.isHeader &&
          candidate.textNormalized
      )
      .sort((left, right) => left.colIndex - right.colIndex);

    for (const headerCell of sameRowHeaderCells) {
      inferred.add(headerCell.textNormalized);
    }

    return inferred.size > 0 ? { ...cell, inferredHeaders: [...inferred] } : cell;
  });

  return {
    ...table,
    cells: nextCells
  };
};
