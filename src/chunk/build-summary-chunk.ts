import type { TableChunk } from "../types/chunk";
import type { DocumentTable } from "../types/table";
import { formatPageRange, joinSectionPath } from "../utils/text";
import { createChunk } from "./shared";

export const buildSummaryChunk = (table: DocumentTable): TableChunk => {
  const lines: string[] = [];

  if (table.title) {
    lines.push(`Table: ${table.title}`);
  }

  const section = joinSectionPath(table.sectionPath);
  if (section) {
    lines.push(`Section: ${section}`);
  }

  lines.push(`Page Range: ${formatPageRange(table.pages)}`);

  if (table.caption) {
    lines.push(`Caption: ${table.caption}`);
  }

  const headers = table.columns.map((column) => column.label ?? `Column ${column.colIndex + 1}`);
  if (headers.length > 0) {
    lines.push(`Columns: ${headers.join(", ")}`);
  }

  return createChunk(table, "summary", "0", lines.join("\n"), [], table.pages, table.cells);
};
