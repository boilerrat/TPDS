import type { TableChunk } from "../types/chunk";
import type { DocumentTable } from "../types/table";
import { createChunk } from "./shared";

export const buildNoteChunks = (table: DocumentTable): TableChunk[] => {
  const lines: string[] = [];

  if (table.notes && table.notes.length > 0) {
    lines.push("Notes:");
    lines.push(...table.notes.map((note) => `- ${note}`));
  }

  if (table.footnotes && table.footnotes.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }

    lines.push("Footnotes:");
    lines.push(...table.footnotes.map((footnote) => `- ${footnote}`));
  }

  const unitLines = table.columns
    .filter((column) => column.units)
    .map((column) => `${column.label ?? `Column ${column.colIndex + 1}`}: ${column.units}`);

  if (unitLines.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }

    lines.push("Units:");
    lines.push(...unitLines.map((line) => `- ${line}`));
  }

  if (lines.length === 0) {
    return [];
  }

  return [createChunk(table, "notes", "0", lines.join("\n"), [], table.pages, table.cells)];
};
