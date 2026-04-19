import { describe, expect, it } from "vitest";

import type { DocumentTable } from "../types/table";
import { tableToHtml } from "../index";
import { loadFixture } from "./helpers";

describe("tableToHtml", () => {
  it("renders semantic table sections and notes", () => {
    const html = tableToHtml(loadFixture("simple-table"));
    expect(html).toContain("<table>");
    expect(html).toContain("<caption>Quarterly revenue and margin by region.</caption>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain('class="tpds-footnotes"');
  });

  it("preserves rowspan and colspan for merged cells", () => {
    const html = tableToHtml(loadFixture("merged-cells-table"));
    expect(html).toContain('rowspan="2"');
    expect(html).toContain('colspan="2"');
  });

  it("renders rowspan and colspan attributes on merged cells", () => {
    const html = tableToHtml(loadFixture("merged-cells-table"));
    expect(html).toContain('rowspan="2"');
    expect(html).toContain('colspan="2"');
  });

  it("renders caption as first child of table element", () => {
    const html = tableToHtml(loadFixture("simple-table"));
    expect(html).toContain("<table>\n  <caption>Quarterly revenue and margin by region.</caption>");
  });

  it("places header rows in thead, body rows in tbody, footer rows in tfoot", () => {
    const html = tableToHtml(loadFixture("footnotes-table"));
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<tfoot>");
    const theadIndex = html.indexOf("<thead>");
    const tbodyIndex = html.indexOf("<tbody>");
    const tfootIndex = html.indexOf("<tfoot>");
    expect(theadIndex).toBeLessThan(tbodyIndex);
    expect(tbodyIndex).toBeLessThan(tfootIndex);
  });

  it("renders footnotes in a div outside the table element", () => {
    const html = tableToHtml(loadFixture("footnotes-table"));
    const tableEnd = html.indexOf("</table>");
    const footnotesDiv = html.indexOf('class="tpds-footnotes"');
    expect(tableEnd).toBeGreaterThan(-1);
    expect(footnotesDiv).toBeGreaterThan(tableEnd);
    expect(html).toContain("¹ Adjusted for age and sex.");
  });

  it("renders notes in a div outside the table element", () => {
    const html = tableToHtml(loadFixture("footnotes-table"));
    const tableEnd = html.indexOf("</table>");
    const notesDiv = html.indexOf('class="tpds-notes"');
    expect(tableEnd).toBeGreaterThan(-1);
    expect(notesDiv).toBeGreaterThan(tableEnd);
    expect(html).toContain("All values are mean");
  });

  it("produces valid table markup for a table with no rows or cells", () => {
    const emptyTable: DocumentTable = {
      standardVersion: "1.0",
      tableId: "empty",
      pages: [],
      columns: [],
      rows: [],
      cells: [],
    };
    const html = tableToHtml(emptyTable);
    expect(html).toContain("<table>");
    expect(html).toContain("</table>");
    expect(html).not.toContain("<thead>");
    expect(html).not.toContain("<tbody>");
    expect(html).not.toContain("<tfoot>");
  });

  it("renders isHeader:true body cells as th and non-header body cells as td", () => {
    const table: DocumentTable = {
      standardVersion: "1.0",
      tableId: "mixed-header",
      pages: [1],
      columns: [],
      rows: [
        { rowIndex: 0, rowType: "header", cellIds: ["h0"] },
        { rowIndex: 1, rowType: "body", cellIds: ["b0", "b1"] },
      ],
      cells: [
        { cellId: "h0", rowIndex: 0, colIndex: 0, textRaw: "Name", textNormalized: "Name", isHeader: true },
        { cellId: "b0", rowIndex: 1, colIndex: 0, textRaw: "Alice", textNormalized: "Alice", isHeader: true },
        { cellId: "b1", rowIndex: 1, colIndex: 1, textRaw: "30", textNormalized: "30" },
      ],
    };
    const html = tableToHtml(table);
    const tbodyStart = html.indexOf("<tbody>");
    const tbodyEnd = html.indexOf("</tbody>");
    const tbodyContent = html.slice(tbodyStart, tbodyEnd);
    expect(tbodyContent).toContain("<th");
    expect(tbodyContent).toContain(">Alice<");
    expect(tbodyContent).toContain("<td");
    expect(tbodyContent).toContain(">30<");
  });
});
