import { normalizeTable } from "../normalize/normalize-table";
import type { DocumentTable } from "../types/table";
import { createId } from "../utils/ids";
import { normalizeText } from "../utils/text";

export type FlatArrayAdapterOptions = {
  firstRowIsHeader?: boolean;
  tableId?: string;
  title?: string;
  sectionPath?: string[];
  pages?: number[];
  standardVersion?: string;
};

export function normalizeFromFlatArray(
  rows: string[][],
  options: FlatArrayAdapterOptions = {}
): DocumentTable {
  if (rows.length === 0) {
    throw new Error("normalizeFromFlatArray: rows must not be empty");
  }

  const {
    firstRowIsHeader = true,
    tableId = createId("tbl"),
    title,
    sectionPath,
    pages = [1],
    standardVersion,
  } = options;

  const firstRow = rows[0];
  if (firstRow === undefined) {
    throw new Error("normalizeFromFlatArray: rows must not be empty");
  }
  const colCount = firstRow.length;
  const hasJaggedRows = rows.some((row) => row !== undefined && row.length !== colCount);

  const cells: Record<string, unknown>[] = [];
  const rowObjects: unknown[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row === undefined) continue;

    const isHeaderRow = firstRowIsHeader && rowIndex === 0;
    const rowType = isHeaderRow ? "header" : "body";
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      const textRaw = String(row[colIndex] ?? "");
      cells.push({
        rowIndex,
        colIndex,
        textRaw,
        textNormalized: normalizeText(textRaw),
        isHeader: isHeaderRow,
      });
    }

    rowObjects.push({
      rowIndex,
      rowType,
      page: pages[0] ?? 1,
    });
  }

  const columns = Array.from({ length: colCount }, (_, i) => ({
    colIndex: i,
  }));

  const raw: Record<string, unknown> = {
    tableId,
    pages,
    columns,
    rows: rowObjects,
    cells,
  };

  if (title !== undefined) raw["title"] = title;
  if (sectionPath !== undefined) raw["sectionPath"] = sectionPath;
  if (standardVersion !== undefined) raw["standardVersion"] = standardVersion;

  const result = normalizeTable(raw);
  if (hasJaggedRows) {
    return {
      ...result,
      fidelityWarnings: [...(result.fidelityWarnings ?? []), "jagged-rows-detected"]
    };
  }
  return result;
}
