import { describe, expect, it } from "vitest";
import doclingFixture from "../fixtures/adapters/docling-input.json";
import { normalizeFromDocling, validateTable } from "../index";

describe("normalizeFromDocling", () => {
  it("fixture normalizes without throwing", () => {
    expect(() => normalizeFromDocling(doclingFixture)).not.toThrow();
  });

  it("result passes validateTable", () => {
    const table = normalizeFromDocling(doclingFixture);
    expect(validateTable(table)).toBeTruthy();
  });

  it("header cells mapped correctly — isHeader true and rowType header", () => {
    const table = normalizeFromDocling(doclingFixture);

    const headerRow = table.rows.find((r) => r.rowType === "header");
    expect(headerRow).toBeDefined();

    const cellMap = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));
    const headerCells = headerRow!.cellIds.map((id) => cellMap[id]);
    expect(headerCells.every((c) => c?.isHeader === true)).toBe(true);
    expect(headerCells.map((c) => c?.textRaw)).toEqual(["Product", "Q1 Revenue", "Q2 Revenue"]);
  });

  it("rowSpan and colSpan mapped from grid cell spans", () => {
    const table = normalizeFromDocling(doclingFixture);
    const cellMap = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));

    // "Widget A" at row 1, col 0 has row_span: 2
    const widgetACell = Object.values(cellMap).find(
      (c) => c?.textRaw === "Widget A" && c.rowIndex === 1
    );
    expect(widgetACell).toBeDefined();
    expect(widgetACell?.rowSpan).toBe(2);

    // "950" at row 2, col 1 has col_span: 2
    const ninetyFiftyCell = Object.values(cellMap).find(
      (c) => c?.textRaw === "950" && c.rowIndex === 2
    );
    expect(ninetyFiftyCell).toBeDefined();
    expect(ninetyFiftyCell?.colSpan).toBe(2);
  });

  it("caption propagated from options", () => {
    const table = normalizeFromDocling(doclingFixture, { caption: "Revenue by Product" });
    expect(table.caption).toBe("Revenue by Product");
  });

  it("page number extracted from prov", () => {
    const table = normalizeFromDocling(doclingFixture);
    expect(table.pages).toContain(2);
  });

  it("invalid input throws", () => {
    expect(() => normalizeFromDocling(null)).toThrow();
    expect(() => normalizeFromDocling(42)).toThrow();
  });
});
