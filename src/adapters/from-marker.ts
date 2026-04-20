import { normalizeTable } from "../normalize/normalize-table";
import type { NormalizeTableOptions } from "../normalize/normalize-table";
import type { DocumentTable } from "../types/table";
import { createId } from "../utils/ids";
import { normalizeText } from "../utils/text";
import { normalizeFromFlatArray } from "./from-flat-array";

export type NormalizeMarkerOptions = NormalizeTableOptions & {
  tableId?: string;
  title?: string;
  caption?: string;
  sourceDocumentId?: string;
  page?: number;
};

function parseMarkdownTable(markdown: string): string[][] {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const dataLines = lines.filter((l) => !/^\|[-:| ]+\|$/.test(l));
  return dataLines.map((line) =>
    line.split("|").slice(1, -1).map((cell) => cell.trim())
  );
}

export function normalizeFromMarker(
  tableBlock: unknown,
  options: NormalizeMarkerOptions = {}
): DocumentTable {
  if (typeof tableBlock === "string") {
    const trimmed = tableBlock.trim();
    if (!trimmed.startsWith("|")) {
      throw new Error("normalizeFromMarker: string input must be a Markdown pipe table");
    }
    const rows = parseMarkdownTable(trimmed);
    if (rows.length === 0) {
      throw new Error("normalizeFromMarker: Markdown table has no rows");
    }
    const table = normalizeFromFlatArray(rows, {
      tableId: options.tableId,
      title: options.title,
      pages: options.page !== undefined ? [options.page] : [1],
      standardVersion: options.standardVersion,
    });
    const existing = table.fidelityWarnings ?? [];
    return {
      ...table,
      caption: options.caption ?? table.caption,
      fidelityWarnings: existing.includes("markdown-lossy")
        ? existing
        : [...existing, "markdown-lossy"],
    };
  }

  if (tableBlock === null || typeof tableBlock !== "object" || Array.isArray(tableBlock)) {
    throw new Error(
      "normalizeFromMarker: tableBlock must be a non-null object or a Markdown pipe-table string"
    );
  }

  const block = tableBlock as Record<string, unknown>;

  if (typeof block["block_type"] === "string" && block["block_type"] !== "Table") {
    throw new Error(
      `normalizeFromMarker: expected block_type "Table", got "${block["block_type"]}"`
    );
  }

  const children = Array.isArray(block["children"]) ? (block["children"] as unknown[]) : [];

  if (children.length === 0) {
    throw new Error("normalizeFromMarker: Table block has no children cells");
  }

  const tableId = options.tableId ?? createId("tbl");
  const page = options.page ?? 1;

  type RowEntry = { rowId: number; isHeader: boolean; cells: Record<string, unknown>[] };
  const rowMap = new Map<number, RowEntry>();

  for (const child of children) {
    if (child === null || typeof child !== "object" || Array.isArray(child)) continue;
    const c = child as Record<string, unknown>;
    if (c["block_type"] !== "TableCell") continue;

    const rowId = typeof c["row_id"] === "number" ? c["row_id"] : undefined;
    const colId = typeof c["col_id"] === "number" ? c["col_id"] : undefined;
    if (rowId === undefined || colId === undefined) continue;

    const isHeader = c["is_header"] === true;
    const rowspan = typeof c["rowspan"] === "number" && c["rowspan"] > 1 ? c["rowspan"] : undefined;
    const colspan = typeof c["colspan"] === "number" && c["colspan"] > 1 ? c["colspan"] : undefined;

    const textLines = Array.isArray(c["text_lines"]) ? (c["text_lines"] as unknown[]) : [];
    const textRaw = textLines.map((l) => (typeof l === "string" ? l : "")).join("\n");

    const cell: Record<string, unknown> = {
      rowIndex: rowId,
      colIndex: colId,
      textRaw,
      textNormalized: normalizeText(textRaw),
      isHeader,
    };
    if (rowspan !== undefined) cell["rowSpan"] = rowspan;
    if (colspan !== undefined) cell["colSpan"] = colspan;

    const row: RowEntry = rowMap.get(rowId) ?? { rowId, isHeader: false, cells: [] };
    if (isHeader) row.isHeader = true;
    row.cells.push(cell);
    rowMap.set(rowId, row);
  }

  if (rowMap.size === 0) {
    throw new Error("normalizeFromMarker: no valid TableCell children found");
  }

  const sortedRowIds = [...rowMap.keys()].sort((a, b) => a - b);
  const allCells: Record<string, unknown>[] = [];
  const rowObjects: unknown[] = [];

  for (const rowId of sortedRowIds) {
    const row = rowMap.get(rowId)!;
    const sorted = row.cells.slice().sort(
      (a, b) => (a["colIndex"] as number) - (b["colIndex"] as number)
    );
    allCells.push(...sorted);
    rowObjects.push({ rowIndex: rowId, rowType: row.isHeader ? "header" : "body", page });
  }

  const numCols = allCells.reduce((max, cell) => {
    const col = (cell["colIndex"] as number) ?? 0;
    const span = typeof cell["colSpan"] === "number" ? cell["colSpan"] : 1;
    return Math.max(max, col + span);
  }, 0);

  const columns = Array.from({ length: numCols }, (_, i) => ({ colIndex: i }));

  const raw: Record<string, unknown> = {
    tableId,
    pages: [page],
    columns,
    rows: rowObjects,
    cells: allCells,
  };

  if (options.caption !== undefined) raw["caption"] = options.caption;
  if (options.title !== undefined) raw["title"] = options.title;
  if (options.sourceDocumentId !== undefined) raw["sourceDocumentId"] = options.sourceDocumentId;

  return normalizeTable(raw, {
    standardVersion: options.standardVersion,
    inferHeaders: options.inferHeaders,
  });
}
