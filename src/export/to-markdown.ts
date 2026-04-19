import type { MarkdownExportResult } from "../types/chunk";
import type { DocumentTable, TableRow } from "../types/table";
import { escapeMarkdownCell, formatPageRange, joinSectionPath, normalizeText } from "../utils/text";
import { cellsForRow, maxColumnIndex, sortRows } from "../utils/table";

const rowMatrix = (table: DocumentTable, rows: TableRow[]): string[][] => {
  const width = maxColumnIndex(table) + 1;

  return rows.map((row) => {
    const values = Array.from({ length: width }, () => "");
    for (const cell of cellsForRow(table, row)) {
      values[cell.colIndex] = escapeMarkdownCell(cell.textNormalized);
    }
    return values;
  });
};

const isSimpleMarkdownTable = (table: DocumentTable): boolean => {
  const hasMergedCells = table.cells.some((cell) => (cell.colSpan ?? 1) > 1 || (cell.rowSpan ?? 1) > 1);
  if (hasMergedCells) {
    return false;
  }

  if (maxColumnIndex(table) + 1 >= 10) {
    return false;
  }

  const headerRows = table.rows.filter((row) => row.rowType === "header" && !row.repeatedHeaderRow);
  return headerRows.length <= 1;
};

const renderStructuredFallback = (table: DocumentTable): string => {
  const lines: string[] = [];

  if (table.title) {
    lines.push(`Table: ${table.title}`);
  }

  const section = joinSectionPath(table.sectionPath);
  if (section) {
    lines.push(`Section: ${section}`);
  }

  lines.push(`Pages: ${formatPageRange(table.pages)}`);

  if (table.caption) {
    lines.push(`Caption: ${table.caption}`);
  }

  lines.push("");

  for (const row of sortRows(table.rows)) {
    const prefix = row.repeatedHeaderRow ? "Repeated Header" : `Row ${row.rowIndex}`;
    const renderedCells = cellsForRow(table, row)
      .map((cell) => {
        const header = cell.inferredHeaders?.join(" > ");
        return header ? `${header}: ${cell.textNormalized}` : cell.textNormalized;
      })
      .join(" | ");
    lines.push(`${prefix}: ${normalizeText(renderedCells)}`);
  }

  if (table.footnotes && table.footnotes.length > 0) {
    lines.push("");
    lines.push("Footnotes:");
    lines.push(...table.footnotes.map((footnote) => `- ${footnote}`));
  }

  return lines.join("\n");
};

export const tableToMarkdown = (table: DocumentTable): MarkdownExportResult => {
  if (!isSimpleMarkdownTable(table)) {
    return {
      markdown: renderStructuredFallback(table),
      fidelity: "lossy",
      warnings: ["markdown-lossy-fallback"]
    };
  }

  const rows = sortRows(table.rows.filter((row) => !row.repeatedHeaderRow));
  if (rows.length === 0) {
    return {
      markdown: "",
      fidelity: "lossless",
      warnings: []
    };
  }

  const headerRow = rows.find((row) => row.rowType === "header") ?? rows[0];
  if (!headerRow) {
    return {
      markdown: "",
      fidelity: "lossless",
      warnings: []
    };
  }

  const bodyRows = rows.filter((row) => row !== headerRow);
  const headerValues = rowMatrix(table, [headerRow])[0] ?? [];
  const bodyValues = rowMatrix(table, bodyRows);

  const lines: string[] = [];

  if (table.caption) {
    lines.push(`> ${table.caption}`);
    lines.push("");
  }

  lines.push(`| ${headerValues.join(" | ")} |`);
  lines.push(`| ${headerValues.map(() => "---").join(" | ")} |`);
  lines.push(...bodyValues.map((row) => `| ${row.join(" | ")} |`));

  if (table.footnotes && table.footnotes.length > 0) {
    lines.push("");
    lines.push(...table.footnotes.map((f) => `_${f}_`));
  }

  return {
    markdown: lines.join("\n"),
    fidelity: "lossless",
    warnings: []
  };
};
