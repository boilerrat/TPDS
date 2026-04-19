import { normalizeTable } from "../normalize/normalize-table";
import type { NormalizeTableOptions } from "../normalize/normalize-table";
import type { DocumentTable } from "../types/table";
import { createId } from "../utils/ids";
import { normalizeText } from "../utils/text";

export type NormalizeDoclingOptions = NormalizeTableOptions & {
  tableId?: string;
  title?: string;
  caption?: string;
  sourceDocumentId?: string;
};

export function normalizeFromDocling(
  tableItem: unknown,
  options: NormalizeDoclingOptions = {}
): DocumentTable {
  if (tableItem === null || typeof tableItem !== "object" || Array.isArray(tableItem)) {
    throw new Error("normalizeFromDocling: tableItem must be a non-null object");
  }

  const item = tableItem as Record<string, unknown>;
  const data = (typeof item.data === "object" && item.data !== null && !Array.isArray(item.data))
    ? (item.data as Record<string, unknown>)
    : {};

  const grid = Array.isArray(data.grid) ? (data.grid as unknown[][]) : [];
  const prov = Array.isArray(item.prov) ? (item.prov as unknown[]) : [];

  if (grid.length === 0) {
    throw new Error("normalizeFromDocling: tableItem.data.grid must be a non-empty array");
  }

  const tableId = options.tableId ?? createId("tbl");

  const pages: number[] = prov.length > 0
    ? [...new Set(
        prov
          .map((p) => {
            const po = p as Record<string, unknown>;
            return typeof po.page_no === "number" ? po.page_no : undefined;
          })
          .filter((n): n is number => n !== undefined)
      )]
    : [1];

  const cells: Record<string, unknown>[] = [];
  const rowObjects: unknown[] = [];

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const gridRow = Array.isArray(grid[rowIndex]) ? (grid[rowIndex] as unknown[]) : [];
    let rowIsHeader = false;

    for (let colIndex = 0; colIndex < gridRow.length; colIndex++) {
      const gridCell = gridRow[colIndex];
      if (gridCell === null || typeof gridCell !== "object" || Array.isArray(gridCell)) continue;
      const gc = gridCell as Record<string, unknown>;

      const startRow = typeof gc.start_row_offset_idx === "number" ? gc.start_row_offset_idx : rowIndex;
      const startCol = typeof gc.start_col_offset_idx === "number" ? gc.start_col_offset_idx : colIndex;

      if (startRow !== rowIndex || startCol !== colIndex) continue;

      const colHeader = gc.column_header === true;
      const rowHeader = gc.row_header === true;
      const isHeader = colHeader || rowHeader;
      if (colHeader) rowIsHeader = true;

      const rowSpan = typeof gc.row_span === "number" && gc.row_span > 1 ? gc.row_span : undefined;
      const colSpan = typeof gc.col_span === "number" && gc.col_span > 1 ? gc.col_span : undefined;

      const textRaw = typeof gc.text === "string" ? gc.text : "";

      const cell: Record<string, unknown> = {
        rowIndex,
        colIndex,
        textRaw,
        textNormalized: normalizeText(textRaw),
        isHeader,
      };
      if (rowSpan !== undefined) cell["rowSpan"] = rowSpan;
      if (colSpan !== undefined) cell["colSpan"] = colSpan;

      cells.push(cell);
    }

    rowObjects.push({
      rowIndex,
      rowType: rowIsHeader ? "header" : "body",
      page: pages[0] ?? 1,
    });
  }

  const numCols =
    typeof data.num_cols === "number"
      ? data.num_cols
      : Array.isArray(grid[0])
        ? (grid[0] as unknown[]).length
        : 0;

  const columns = Array.from({ length: numCols }, (_, i) => ({ colIndex: i }));

  const caption =
    options.caption ??
    (typeof item.caption === "string" ? item.caption : undefined);

  const raw: Record<string, unknown> = {
    tableId,
    pages,
    columns,
    rows: rowObjects,
    cells,
  };

  if (caption !== undefined) raw["caption"] = caption;
  if (options.title !== undefined) raw["title"] = options.title;
  if (options.sourceDocumentId !== undefined) raw["sourceDocumentId"] = options.sourceDocumentId;

  return normalizeTable(raw, {
    standardVersion: options.standardVersion,
    inferHeaders: options.inferHeaders,
  });
}
