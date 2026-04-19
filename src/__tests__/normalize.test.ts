import { describe, expect, it } from "vitest";

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
