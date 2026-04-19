import type { DocumentTable, TableRow } from "../types/table";
import { escapeHtml } from "../utils/text";
import { cellsForRow, sortRows } from "../utils/table";

const renderRows = (table: DocumentTable, rows: TableRow[], cellTag: "td" | "th"): string =>
  rows
    .map((row) => {
      const cells = cellsForRow(table, row);
      const cellsHtml = cells
        .map((cell) => {
          const tag = cell.isHeader || cellTag === "th" ? "th" : "td";
          const rowSpan = (cell.rowSpan ?? 1) > 1 ? ` rowspan="${cell.rowSpan}"` : "";
          const colSpan = (cell.colSpan ?? 1) > 1 ? ` colspan="${cell.colSpan}"` : "";
          const scope = tag === "th" ? ` scope="${row.rowType === "header" ? "col" : "row"}"` : "";
          return `    <${tag}${rowSpan}${colSpan}${scope}>${escapeHtml(cell.textNormalized)}</${tag}>`;
        })
        .join("\n");

      return `  <tr>\n${cellsHtml}\n  </tr>`;
    })
    .join("\n");

export const tableToHtml = (table: DocumentTable): string => {
  const rows = sortRows(table.rows);
  const theadRows = rows.filter((row) => row.rowType === "header");
  const tfootRows = rows.filter((row) => row.rowType === "footer" || row.rowType === "note");
  const tbodyRows = rows.filter((row) => !theadRows.includes(row) && !tfootRows.includes(row));

  const parts: string[] = ["<table>"];

  if (table.caption) {
    parts.push(`  <caption>${escapeHtml(table.caption)}</caption>`);
  }

  if (theadRows.length > 0) {
    parts.push("  <thead>");
    parts.push(renderRows(table, theadRows, "th"));
    parts.push("  </thead>");
  }

  if (tbodyRows.length > 0) {
    parts.push("  <tbody>");
    parts.push(renderRows(table, tbodyRows, "td"));
    parts.push("  </tbody>");
  }

  if (tfootRows.length > 0) {
    parts.push("  <tfoot>");
    parts.push(renderRows(table, tfootRows, "td"));
    parts.push("  </tfoot>");
  }

  parts.push("</table>");

  if (table.notes && table.notes.length > 0) {
    parts.push(`<div class="tpds-notes">${table.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}</div>`);
  }

  if (table.footnotes && table.footnotes.length > 0) {
    parts.push(
      `<div class="tpds-footnotes">${table.footnotes.map((footnote) => `<p>${escapeHtml(footnote)}</p>`).join("")}</div>`
    );
  }

  return parts.join("\n");
};
