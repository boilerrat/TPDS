import { describe, expect, it } from "vitest";
import markerFixture from "../fixtures/adapters/marker-input.json";
import { normalizeFromMarker, validateTable } from "../index";

describe("normalizeFromMarker", () => {
  it("fixture normalizes without throwing", () => {
    expect(() => normalizeFromMarker(markerFixture)).not.toThrow();
  });

  it("result passes validateTable", () => {
    const table = normalizeFromMarker(markerFixture);
    expect(validateTable(table)).toBeTruthy();
  });

  it("header cells mapped correctly — isHeader true and rowType header", () => {
    const table = normalizeFromMarker(markerFixture);
    const headerRow = table.rows.find((r) => r.rowType === "header");
    expect(headerRow).toBeDefined();
    const cellMap = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));
    const headerCells = headerRow!.cellIds.map((id) => cellMap[id]);
    expect(headerCells.every((c) => c?.isHeader === true)).toBe(true);
    expect(headerCells.map((c) => c?.textRaw)).toEqual(["Product", "Q1 Revenue", "Q2 Revenue"]);
  });

  it("rowSpan and colSpan mapped from TableCell spans", () => {
    const table = normalizeFromMarker(markerFixture);
    const cellMap = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));

    const widgetACell = Object.values(cellMap).find(
      (c) => c?.textRaw === "Widget A" && c.rowIndex === 1
    );
    expect(widgetACell).toBeDefined();
    expect(widgetACell?.rowSpan).toBe(2);

    const ninetyFiftyCell = Object.values(cellMap).find(
      (c) => c?.textRaw === "950" && c.rowIndex === 2
    );
    expect(ninetyFiftyCell).toBeDefined();
    expect(ninetyFiftyCell?.colSpan).toBe(2);
  });

  it("Markdown pipe-table string → normalizes + fidelityWarnings includes markdown-lossy", () => {
    const markdown =
      "| Product | Q1 | Q2 |\n|---|---|---|\n| Widget A | 100 | 200 |\n| Widget B | 300 | 400 |";
    const table = normalizeFromMarker(markdown);
    expect(validateTable(table)).toBeTruthy();
    expect(table.fidelityWarnings).toContain("markdown-lossy");
  });

  it("invalid input throws", () => {
    expect(() => normalizeFromMarker(null)).toThrow();
    expect(() => normalizeFromMarker(42)).toThrow();
    expect(() => normalizeFromMarker({})).toThrow();
  });

  it("string path preserves caption option", () => {
    const markdown =
      "| A | B |\n|---|---|\n| 1 | 2 |";
    const table = normalizeFromMarker(markdown, { caption: "My Caption" });
    expect(table.caption).toBe("My Caption");
  });
});
