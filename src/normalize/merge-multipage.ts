import type { DocumentTable, TableCell, TableRow } from "../types/table";
import { createCellId } from "../utils/ids";
import { normalizeText } from "../utils/text";
import { sortCells, sortPages, sortRows } from "../utils/table";

export type MergeMultiPageTablesOptions = {
  mergeByTitle?: boolean;
};

const mergeKey = (table: DocumentTable, options: MergeMultiPageTablesOptions): string => {
  const continuityId = table.continuity?.logicalTableGroupId;
  if (continuityId) {
    return continuityId;
  }

  const docId = table.sourceDocumentId ?? "unknown-doc";
  const title = options.mergeByTitle === false
    ? ""
    : normalizeText(table.title ?? "") || normalizeText(table.caption ?? "");

  if (!title) {
    return `${docId}:${table.tableId}`;
  }

  const columns = table.columns.map((column) => normalizeText(column.label ?? String(column.colIndex))).join("|");
  return `${docId}:${title}:${columns}`;
};

const offsetTable = (table: DocumentTable, rowOffset: number, tableId: string): Pick<DocumentTable, "rows" | "cells"> => {
  const rowIndexMap = new Map(table.rows.map((row) => [row.rowIndex, row.rowIndex + rowOffset]));

  const cells: TableCell[] = table.cells.map((cell) => {
    const nextRowIndex = rowIndexMap.get(cell.rowIndex) ?? cell.rowIndex + rowOffset;
    return {
      ...cell,
      cellId: createCellId(tableId, nextRowIndex, cell.colIndex),
      rowIndex: nextRowIndex
    };
  });

  const cellIdMap = new Map(
    table.cells.map((cell) => [cell.cellId, createCellId(tableId, (rowIndexMap.get(cell.rowIndex) ?? cell.rowIndex + rowOffset), cell.colIndex)])
  );

  return {
    rows: table.rows.map((row) => ({
      ...row,
      rowIndex: row.rowIndex + rowOffset,
      cellIds: row.cellIds.map(
        (cellId) => cellIdMap.get(cellId) ?? createCellId(tableId, row.rowIndex + rowOffset, 0)
      )
    })),
    cells
  };
};

export const mergeMultiPageTables = (
  tables: DocumentTable[],
  options: MergeMultiPageTablesOptions = {}
): DocumentTable[] => {
  const grouped = new Map<string, DocumentTable[]>();

  for (const table of tables) {
    const key = mergeKey(table, options);
    const group = grouped.get(key) ?? [];
    group.push(table);
    grouped.set(key, group);
  }

  return [...grouped.values()].flatMap((group) => {
    const sortedGroup = [...group].sort((left, right) => (left.pages[0] ?? 0) - (right.pages[0] ?? 0));
    const base = sortedGroup[0];
    if (!base) {
      return [];
    }

    if (sortedGroup.length === 1) {
      return [base];
    }

    let maxRowIndex = Math.max(-1, ...base.rows.map((row) => row.rowIndex));
    const mergedRows = [...base.rows];
    const mergedCells = [...base.cells];

    for (const table of sortedGroup.slice(1)) {
      const rowOffset = maxRowIndex + 1;
      const offset = offsetTable(table, rowOffset, base.tableId);
      mergedRows.push(...offset.rows);
      mergedCells.push(...offset.cells);
      maxRowIndex = Math.max(maxRowIndex, ...offset.rows.map((row) => row.rowIndex));
    }

    return [{
      ...base,
      pages: sortPages(sortedGroup.flatMap((table) => table.pages)),
      pageSpans: sortPages(
        sortedGroup.flatMap((table) => table.pageSpans?.map((pageSpan) => pageSpan.page) ?? [])
      ).map((page) => {
        const match = sortedGroup.flatMap((table) => table.pageSpans ?? []).find((pageSpan) => pageSpan.page === page);
        return match ?? { page };
      }),
      rows: sortRows(mergedRows),
      cells: sortCells(mergedCells),
      continuity: {
        isMultiPage: true,
        logicalTableGroupId: base.continuity?.logicalTableGroupId ?? mergeKey(base, options),
        continuedFromPreviousPage: base.continuity?.continuedFromPreviousPage,
        continuesOnNextPage: sortedGroup[sortedGroup.length - 1]?.continuity?.continuesOnNextPage
      },
      provenance: sortedGroup.flatMap((table) => table.provenance ?? [])
    }];
  });
};
