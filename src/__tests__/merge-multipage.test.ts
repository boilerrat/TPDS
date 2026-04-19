import { describe, expect, it } from "vitest";

import { mergeMultiPageTables } from "../index";
import type { DocumentTable } from "../types/table";
import { loadFixture } from "./helpers";

const makeTable = (
  tableId: string,
  sourceDocumentId: string,
  title: string,
  pages: number[],
  overrides: Partial<DocumentTable> = {}
): DocumentTable => ({
  standardVersion: "1.0.0",
  tableId,
  sourceDocumentId,
  title,
  pages,
  columns: [
    { colIndex: 0, label: "Col A" },
    { colIndex: 1, label: "Col B" },
  ],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: [`${tableId}:r0c0`, `${tableId}:r0c1`], page: pages[0] },
    { rowIndex: 1, rowType: "body", cellIds: [`${tableId}:r1c0`, `${tableId}:r1c1`], page: pages[0] },
  ],
  cells: [
    { cellId: `${tableId}:r0c0`, rowIndex: 0, colIndex: 0, textRaw: "Col A", textNormalized: "Col A", isHeader: true, page: pages[0] },
    { cellId: `${tableId}:r0c1`, rowIndex: 0, colIndex: 1, textRaw: "Col B", textNormalized: "Col B", isHeader: true, page: pages[0] },
    { cellId: `${tableId}:r1c0`, rowIndex: 1, colIndex: 0, textRaw: "v1", textNormalized: "v1", page: pages[0] },
    { cellId: `${tableId}:r1c1`, rowIndex: 1, colIndex: 1, textRaw: "v2", textNormalized: "v2", page: pages[0] },
  ],
  ...overrides,
});

describe("mergeMultiPageTables", () => {
  it("returns a single-element array unchanged (passthrough)", () => {
    const table = makeTable("t1", "doc-a", "Report", [1]);
    const result = mergeMultiPageTables([table]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(table);
  });

  it("merges two tables sharing a logicalTableGroupId into one", () => {
    const continuity = { isMultiPage: true, logicalTableGroupId: "grp-merge" };
    const page1 = makeTable("t-p1", "doc-b", "Revenue", [3], { continuity });
    const page2 = makeTable("t-p2", "doc-b", "Revenue", [4], { continuity });
    const result = mergeMultiPageTables([page1, page2]);
    expect(result).toHaveLength(1);
    expect(result[0]?.pages).toEqual([3, 4]);
    expect(result[0]?.continuity?.isMultiPage).toBe(true);
  });

  it("merges two tables by matching title and column labels when no logicalTableGroupId", () => {
    const page1 = makeTable("title-p1", "doc-c", "Expenses", [7]);
    const page2 = makeTable("title-p2", "doc-c", "Expenses", [8]);
    const result = mergeMultiPageTables([page1, page2]);
    expect(result).toHaveLength(1);
    expect(result[0]?.pages).toEqual([7, 8]);
  });

  it("offsets row indexes of continuation pages to prevent collisions", () => {
    const fixture = loadFixture("multipage-table");
    const page20: DocumentTable = {
      ...fixture,
      tableId: "shipment-p20",
      pages: [20],
      rows: fixture.rows.filter((r) => r.page === 20),
      cells: fixture.cells.filter((c) => c.page === 20),
    };
    const page21: DocumentTable = {
      ...fixture,
      tableId: "shipment-p21",
      pages: [21],
      rows: fixture.rows.filter((r) => r.page === 21).map((r) => ({ ...r, rowIndex: r.rowIndex - 2 })),
      cells: fixture.cells.filter((c) => c.page === 21).map((c) => ({ ...c, rowIndex: c.rowIndex - 2 })),
    };
    const result = mergeMultiPageTables([page20, page21]);
    expect(result).toHaveLength(1);
    const mergedRowIndexes = result[0]?.rows.map((r) => r.rowIndex) ?? [];
    expect(new Set(mergedRowIndexes).size).toBe(mergedRowIndexes.length);
  });

  it("regenerates cell IDs in merged table consistent with base tableId and offset rowIndex", () => {
    const continuity = { isMultiPage: true, logicalTableGroupId: "grp-cellid" };
    const base = makeTable("base-tbl", "doc-d", "Sales", [1], { continuity });
    const cont = makeTable("cont-tbl", "doc-d", "Sales", [2], { continuity });
    const result = mergeMultiPageTables([base, cont]);
    const merged = result[0];
    expect(merged).toBeDefined();
    for (const cell of merged?.cells ?? []) {
      const expected = `${merged?.tableId}:r${cell.rowIndex}c${cell.colIndex}`;
      expect(cell.cellId).toBe(expected);
    }
  });

  it("deduplicates and sorts the pages array on merge", () => {
    const continuity = { isMultiPage: true, logicalTableGroupId: "grp-dedup" };
    const t1 = makeTable("dedup-1", "doc-e", "Inv", [5, 6], { continuity });
    const t2 = makeTable("dedup-2", "doc-e", "Inv", [6, 7], { continuity });
    const result = mergeMultiPageTables([t1, t2]);
    expect(result[0]?.pages).toEqual([5, 6, 7]);
  });

  it("keeps tables with different titles and columns as separate results", () => {
    const revenue = makeTable("rev", "doc-f", "Revenue", [1], {
      columns: [{ colIndex: 0, label: "Quarter" }, { colIndex: 1, label: "Amount" }],
    });
    const expenses = makeTable("exp", "doc-f", "Expenses", [2], {
      columns: [{ colIndex: 0, label: "Month" }, { colIndex: 1, label: "Cost" }],
    });
    const result = mergeMultiPageTables([revenue, expenses]);
    expect(result).toHaveLength(2);
  });

  it("does not merge unrelated untitled tables that only share document and columns", () => {
    const page1 = makeTable("untitled-1", "doc-h", "", [1], {
      title: undefined,
      caption: undefined,
      columns: [{ colIndex: 0 }, { colIndex: 1 }],
    });
    const page2 = makeTable("untitled-2", "doc-h", "", [2], {
      title: undefined,
      caption: undefined,
      columns: [{ colIndex: 0 }, { colIndex: 1 }],
    });

    const result = mergeMultiPageTables([page1, page2]);

    expect(result).toHaveLength(2);
  });

  it("does not merge title-matching tables when mergeByTitle is false", () => {
    const t1 = makeTable("opt-1", "doc-g", "Summary", [1]);
    const t2 = makeTable("opt-2", "doc-g", "Summary", [2]);
    const withDefault = mergeMultiPageTables([t1, t2]);
    const withFalse = mergeMultiPageTables([t1, t2], { mergeByTitle: false });
    expect(withDefault).toHaveLength(1);
    expect(withFalse).toHaveLength(2);
  });
});
