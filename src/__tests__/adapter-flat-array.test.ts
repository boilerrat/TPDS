import { describe, expect, it } from "vitest";

import { normalizeFromFlatArray } from "../index";
import { validateTable } from "../index";

describe("normalizeFromFlatArray", () => {
  it("basic 3-column table with header row", () => {
    const rows = [
      ["Name", "Age", "City"],
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ];
    const table = normalizeFromFlatArray(rows);

    expect(validateTable(table)).toBeTruthy();
    expect(table.columns).toHaveLength(3);

    const headerRow = table.rows.find((r) => r.rowType === "header");
    expect(headerRow).toBeDefined();

    const cellMap = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));
    const headerCells = headerRow!.cellIds.map((id) => cellMap[id]);
    expect(headerCells.map((c) => c?.textRaw)).toEqual(["Name", "Age", "City"]);
    expect(headerCells.every((c) => c?.isHeader === true)).toBe(true);

    const bodyRows = table.rows.filter((r) => r.rowType === "body");
    expect(bodyRows).toHaveLength(2);
  });

  it("firstRowIsHeader: false — all rows become body rows", () => {
    const rows = [
      ["Alice", "30", "NYC"],
      ["Bob", "25", "LA"],
    ];
    const table = normalizeFromFlatArray(rows, { firstRowIsHeader: false });

    expect(validateTable(table)).toBeTruthy();
    expect(table.rows.every((r) => r.rowType === "body")).toBe(true);
    const cellMap2 = Object.fromEntries(table.cells.map((c) => [c.cellId, c]));
    expect(table.rows.every((r) =>
      r.cellIds.every((id) => cellMap2[id]?.isHeader === false)
    )).toBe(true);
  });

  it("empty input throws", () => {
    expect(() => normalizeFromFlatArray([])).toThrow();
  });

  it("single-row input with firstRowIsHeader: true produces header-only table", () => {
    const rows = [["Col A", "Col B"]];
    const table = normalizeFromFlatArray(rows);

    expect(validateTable(table)).toBeTruthy();
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]?.rowType).toBe("header");
  });

  it("options: tableId and title propagate", () => {
    const rows = [["X"], ["1"]];
    const table = normalizeFromFlatArray(rows, {
      tableId: "my-table-id",
      title: "My Table",
    });

    expect(table.tableId).toBe("my-table-id");
    expect(table.title).toBe("My Table");
  });
});
