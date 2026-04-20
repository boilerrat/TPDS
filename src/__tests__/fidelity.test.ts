import { describe, expect, it } from "vitest";

import { addFidelityWarnings } from "../utils/fidelity-warnings";
import type { DocumentTable } from "../types/table";
import { loadFixture } from "./helpers";

const baseTable: DocumentTable = {
  standardVersion: "1.0.0",
  tableId: "test-table",
  pages: [1],
  columns: [{ colIndex: 0 }, { colIndex: 1 }],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["c0", "c1"] },
    { rowIndex: 1, rowType: "body", cellIds: ["c2", "c3"] }
  ],
  cells: [
    { cellId: "c0", rowIndex: 0, colIndex: 0, textRaw: "Col A", textNormalized: "Col A" },
    { cellId: "c1", rowIndex: 0, colIndex: 1, textRaw: "Col B", textNormalized: "Col B" },
    { cellId: "c2", rowIndex: 1, colIndex: 0, textRaw: "val", textNormalized: "val" },
    { cellId: "c3", rowIndex: 1, colIndex: 1, textRaw: "val2", textNormalized: "val2" }
  ]
};

describe("addFidelityWarnings", () => {
  it("returns new object — does not mutate input", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result).not.toBe(baseTable);
  });

  it("returns no warnings for a clean table", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).toHaveLength(0);
  });

  it("detects merged-cells-present via rowSpan > 1", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [{ ...baseTable.cells[0]!, rowSpan: 2 }, ...baseTable.cells.slice(1)]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("merged-cells-present");
  });

  it("detects merged-cells-present via colSpan > 1", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [{ ...baseTable.cells[0]!, colSpan: 2 }, ...baseTable.cells.slice(1)]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("merged-cells-present");
  });

  it("sets markdown-lossy when merged-cells-present", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [{ ...baseTable.cells[0]!, rowSpan: 2 }, ...baseTable.cells.slice(1)]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("markdown-lossy");
  });

  it("does not set markdown-lossy without merged-cells-present", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).not.toContain("markdown-lossy");
  });

  it("detects headers-inferred", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [
        { ...baseTable.cells[0]!, inferredHeaders: ["Some Header"] },
        ...baseTable.cells.slice(1)
      ]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("headers-inferred");
  });

  it("does not set headers-inferred when inferredHeaders is absent or empty", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).not.toContain("headers-inferred");
  });

  it("detects repeated-headers-detected", () => {
    const table: DocumentTable = {
      ...baseTable,
      rows: [
        ...baseTable.rows,
        { rowIndex: 2, rowType: "header", cellIds: ["c4", "c5"], repeatedHeaderRow: true }
      ],
      cells: [
        ...baseTable.cells,
        { cellId: "c4", rowIndex: 2, colIndex: 0, textRaw: "Col A", textNormalized: "Col A" },
        { cellId: "c5", rowIndex: 2, colIndex: 1, textRaw: "Col B", textNormalized: "Col B" }
      ]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("repeated-headers-detected");
  });

  it("does not set repeated-headers-detected without repeatedHeaderRow", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).not.toContain("repeated-headers-detected");
  });

  it("detects ocr-noise-suspected when edit distance > 1", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [
        ...baseTable.cells.slice(0, 2),
        { ...baseTable.cells[2]!, textRaw: "l2,450", textNormalized: "12450" },
        baseTable.cells[3]!
      ]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("ocr-noise-suspected");
  });

  it("does not set ocr-noise-suspected when edit distance <= 1", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [
        ...baseTable.cells.slice(0, 2),
        { ...baseTable.cells[2]!, textRaw: "vak", textNormalized: "val" },
        baseTable.cells[3]!
      ]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings ?? []).not.toContain("ocr-noise-suspected");
  });

  it("does not set ocr-noise-suspected when textRaw equals textNormalized", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).not.toContain("ocr-noise-suspected");
  });

  it("detects multi-page-merged when continuity.isMultiPage is true", () => {
    const table: DocumentTable = { ...baseTable, continuity: { isMultiPage: true } };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("multi-page-merged");
  });

  it("does not set multi-page-merged when continuity.isMultiPage is false", () => {
    const table: DocumentTable = { ...baseTable, continuity: { isMultiPage: false } };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings ?? []).not.toContain("multi-page-merged");
  });

  it("does not set multi-page-merged when continuity is absent", () => {
    const result = addFidelityWarnings(baseTable);
    expect(result.fidelityWarnings ?? []).not.toContain("multi-page-merged");
  });

  it("all fixtures pass through without throwing", () => {
    for (const name of [
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
      const fixture = loadFixture(name);
      expect(() => addFidelityWarnings(fixture)).not.toThrow();
    }
  });

  it("ocr-noisy-table fixture triggers ocr-noise-suspected", () => {
    const fixture = loadFixture("ocr-noisy-table");
    const result = addFidelityWarnings(fixture);
    expect(result.fidelityWarnings).toContain("ocr-noise-suspected");
  });

  it("merged-cells-table fixture triggers merged-cells-present and markdown-lossy", () => {
    const fixture = loadFixture("merged-cells-table");
    const result = addFidelityWarnings(fixture);
    expect(result.fidelityWarnings).toContain("merged-cells-present");
    expect(result.fidelityWarnings).toContain("markdown-lossy");
  });

  it("repeated-headers-table fixture triggers repeated-headers-detected", () => {
    const fixture = loadFixture("repeated-headers-table");
    const result = addFidelityWarnings(fixture);
    expect(result.fidelityWarnings).toContain("repeated-headers-detected");
  });

  it("multipage-table fixture triggers multi-page-merged", () => {
    const fixture = loadFixture("multipage-table");
    const result = addFidelityWarnings(fixture);
    expect(result.fidelityWarnings).toContain("multi-page-merged");
  });

  it("nested-headers-table fixture triggers headers-inferred", () => {
    const fixture = loadFixture("nested-headers-table");
    const result = addFidelityWarnings(fixture);
    expect(result.fidelityWarnings).toContain("headers-inferred");
  });

  it("does not duplicate warnings when multiple conditions apply", () => {
    const table: DocumentTable = {
      ...baseTable,
      cells: [{ ...baseTable.cells[0]!, rowSpan: 2 }, ...baseTable.cells.slice(1)],
      continuity: { isMultiPage: true }
    };
    const result = addFidelityWarnings(table);
    const warnings = result.fidelityWarnings ?? [];
    expect(new Set(warnings).size).toBe(warnings.length);
  });

  it("does not flag ocr-noise-suspected when either string exceeds MAX_LEVENSHTEIN_LEN", () => {
    const long = "x".repeat(1000);
    const table: DocumentTable = {
      ...baseTable,
      cells: [
        { ...baseTable.cells[0]!, textRaw: long, textNormalized: long.slice(0, 999) + "y" },
        ...baseTable.cells.slice(1)
      ]
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings ?? []).not.toContain("ocr-noise-suspected");
  });

  it("preserves existing fidelityWarnings when adding new ones", () => {
    const table: DocumentTable = {
      ...baseTable,
      fidelityWarnings: ["headers-inferred"],
      continuity: { isMultiPage: true }
    };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("headers-inferred");
    expect(result.fidelityWarnings).toContain("multi-page-merged");
  });

  it("does not lose manually-set warning when no auto-detection fires", () => {
    const table: DocumentTable = { ...baseTable, fidelityWarnings: ["markdown-lossy"] };
    const result = addFidelityWarnings(table);
    expect(result.fidelityWarnings).toContain("markdown-lossy");
  });
});
