import type { SourceRef } from "../types/common";
import type { DocumentTable, TableCell, TableRow } from "../types/table";

export const sortPages = (pages: number[]): number[] =>
  [...new Set(pages)].sort((left, right) => left - right);

export const sortRows = (rows: TableRow[]): TableRow[] =>
  [...rows].sort((left, right) => left.rowIndex - right.rowIndex);

export const sortCells = (cells: TableCell[]): TableCell[] =>
  [...cells].sort((left, right) => {
    if (left.rowIndex !== right.rowIndex) {
      return left.rowIndex - right.rowIndex;
    }

    return left.colIndex - right.colIndex;
  });

export const cellsById = (table: DocumentTable): Map<string, TableCell> =>
  new Map(table.cells.map((cell) => [cell.cellId, cell]));

export const cellsForRow = (table: DocumentTable, row: TableRow): TableCell[] => {
  const cellMap = cellsById(table);
  return row.cellIds
    .map((cellId) => cellMap.get(cellId))
    .filter((cell): cell is TableCell => Boolean(cell))
    .sort((left, right) => left.colIndex - right.colIndex);
};

export const collectSourceRefs = (cells: TableCell[]): SourceRef[] => {
  const refs = new Map<string, SourceRef>();

  for (const cell of cells) {
    for (const sourceRef of cell.sourceRefs ?? []) {
      const key = `${sourceRef.page}:${sourceRef.extractor ?? ""}:${sourceRef.extractorVersion ?? ""}`;
      refs.set(key, sourceRef);
    }
  }

  return [...refs.values()].sort((left, right) => left.page - right.page);
};

export const maxColumnIndex = (table: DocumentTable): number =>
  Math.max(-1, ...table.columns.map((column) => column.colIndex), ...table.cells.map((cell) => cell.colIndex));
