import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { documentTableSchema } from "../schema/zod";
import { normalizeTable, safeValidateTable, validateTable } from "../index";
import { loadFixture } from "./helpers";

describe("fixtures", () => {
  it("validate against the canonical schema", () => {
    for (const fixtureName of [
      "simple-table",
      "merged-cells-table",
      "multipage-table",
      "broken-markdown-case",
      "footnotes-table",
      "wide-table",
      "ocr-noisy-table",
      "repeated-headers-table",
      "financial-table",
      "nested-headers-table",
      "wage-schedule-colspan",
      "wage-schedule-rowspan"
    ]) {
      const fixture = loadFixture(fixtureName);
      expect(() => documentTableSchema.parse(fixture)).not.toThrow();
      expect(safeValidateTable(fixture).success).toBe(true);
      expect(validateTable(fixture).tableId).toBe(fixture.tableId);
    }
  });
});

describe("normalizeTable", () => {
  it("normalizes whitespace, infers headers, and preserves continuity markers", () => {
    const normalized = normalizeTable({
      tableId: "normalized-table",
      title: "Revenue by Quarter",
      pages: [3, 2, 2],
      columns: [{ colIndex: 0 }, { colIndex: 1 }],
      cells: [
        {
          rowIndex: 0,
          colIndex: 0,
          textRaw: " Quarter ",
          textNormalized: " Quarter ",
          isHeader: true,
          page: 2
        },
        {
          rowIndex: 0,
          colIndex: 1,
          textRaw: " Revenue ",
          isHeader: true,
          page: 2
        },
        {
          rowIndex: 1,
          colIndex: 0,
          textRaw: "Q1 2025",
          page: 3
        },
        {
          rowIndex: 1,
          colIndex: 1,
          textRaw: "12.4M",
          page: 3
        }
      ]
    });

    expect(normalized.pages).toEqual([2, 3]);
    expect(normalized.cells.find((cell) => cell.rowIndex === 0 && cell.colIndex === 0)?.textNormalized).toBe("Quarter");
    expect(normalized.cells.find((cell) => cell.rowIndex === 1 && cell.colIndex === 1)?.inferredHeaders).toContain(
      "Revenue"
    );
    expect(normalized.continuity?.isMultiPage).toBe(true);
  });

  it("marks repeated continuation headers instead of treating them as new data", () => {
    const fixture = loadFixture("multipage-table");
    const normalized = normalizeTable(fixture, { preserveExistingCellIds: true });
    const repeatedHeader = normalized.rows.find((row) => row.rowIndex === 2);
    expect(repeatedHeader?.repeatedHeaderRow).toBe(true);
    expect(repeatedHeader?.rowType).toBe("header");
  });
});

describe("normalizeTable edge cases", () => {
  it("derives rows from cell rowIndex groupings when rows array is absent", () => {
    const result = normalizeTable({
      tableId: "t-row-derive",
      cells: [
        { rowIndex: 0, colIndex: 0, textRaw: "Name", isHeader: true },
        { rowIndex: 0, colIndex: 1, textRaw: "Age", isHeader: true },
        { rowIndex: 1, colIndex: 0, textRaw: "Alice" },
        { rowIndex: 1, colIndex: 1, textRaw: "30" }
      ]
    });
    expect(result.rows).toHaveLength(2);
    expect(result.rows.find((r) => r.rowIndex === 0)?.rowType).toBe("header");
    expect(result.rows.find((r) => r.rowIndex === 1)?.rowType).toBe("body");
  });

  it("infers columns from unique colIndex values when columns array is absent", () => {
    const result = normalizeTable({
      tableId: "t-col-infer",
      cells: [
        { rowIndex: 0, colIndex: 0, textRaw: "A" },
        { rowIndex: 0, colIndex: 1, textRaw: "B" },
        { rowIndex: 0, colIndex: 2, textRaw: "C" }
      ]
    });
    expect(result.columns).toHaveLength(3);
    expect(result.columns.map((c) => c.colIndex)).toEqual([0, 1, 2]);
  });

  it("derives pages from pageSpans when no explicit pages or cell pages are present", () => {
    const result = normalizeTable({
      tableId: "t-page-spans",
      pageSpans: [{ page: 5 }, { page: 6 }],
      cells: [{ rowIndex: 0, colIndex: 0, textRaw: "X" }]
    });
    expect(result.pages).toContain(5);
    expect(result.pages).toContain(6);
  });

  it("auto-sets continuity.isMultiPage when table spans multiple pages with no explicit continuity", () => {
    const result = normalizeTable({
      tableId: "t-continuity",
      cells: [
        { rowIndex: 0, colIndex: 0, textRaw: "A", page: 3 },
        { rowIndex: 1, colIndex: 0, textRaw: "B", page: 4 }
      ]
    });
    expect(result.continuity?.isMultiPage).toBe(true);
  });

  it("marks second row with identical header text as repeatedHeaderRow", () => {
    const result = normalizeTable({
      tableId: "t-repeated-header",
      cells: [
        { rowIndex: 0, colIndex: 0, textRaw: "Name", isHeader: true },
        { rowIndex: 0, colIndex: 1, textRaw: "Age", isHeader: true },
        { rowIndex: 1, colIndex: 0, textRaw: "Alice" },
        { rowIndex: 1, colIndex: 1, textRaw: "30" },
        { rowIndex: 2, colIndex: 0, textRaw: "Name", isHeader: true },
        { rowIndex: 2, colIndex: 1, textRaw: "Age", isHeader: true }
      ]
    });
    expect(result.rows.find((r) => r.rowIndex === 2)?.repeatedHeaderRow).toBe(true);
    expect(result.rows.find((r) => r.rowIndex === 2)?.rowType).toBe("header");
  });

  it("does not populate inferredHeaders on cells when inferHeaders option is false", () => {
    const result = normalizeTable(
      {
        tableId: "t-no-infer",
        cells: [
          { rowIndex: 0, colIndex: 0, textRaw: "Name", isHeader: true },
          { rowIndex: 1, colIndex: 0, textRaw: "Alice" }
        ]
      },
      { inferHeaders: false }
    );
    const bodyCell = result.cells.find((c) => c.rowIndex === 1 && c.colIndex === 0);
    expect(bodyCell?.inferredHeaders).toBeUndefined();
  });

  it("preserves existing cellId values when preserveExistingCellIds option is true", () => {
    const result = normalizeTable(
      {
        tableId: "t-preserve-ids",
        cells: [{ rowIndex: 0, colIndex: 0, textRaw: "A", cellId: "custom-cell-id" }]
      },
      { preserveExistingCellIds: true }
    );
    expect(result.cells[0]?.cellId).toBe("custom-cell-id");
  });

  it("throws TypeError for non-object input", () => {
    expect(() => normalizeTable(null)).toThrow(TypeError);
    expect(() => normalizeTable("string")).toThrow(TypeError);
  });

  it("throws ZodError when normalized output fails schema validation", () => {
    expect(() => normalizeTable({ tableId: "" })).toThrow(ZodError);
  });
});
