import { describe, expect, it } from "vitest";

import {
  buildNoteChunks,
  buildRowChunks,
  buildRowGroupChunks,
  buildTableChunks,
  inferHeaders,
  mergeMultiPageTables,
} from "../index";
import { loadFixture } from "./helpers";

describe("chunk builders", () => {
  it("builds summary, row, row-group, and notes chunks", () => {
    const chunks = buildTableChunks(loadFixture("simple-table"), { rowGroupSize: 1 });
    expect(chunks.some((chunk) => chunk.chunkType === "summary")).toBe(true);
    expect(chunks.some((chunk) => chunk.chunkType === "row")).toBe(true);
    expect(chunks.some((chunk) => chunk.chunkType === "row-group")).toBe(true);
    expect(chunks.some((chunk) => chunk.chunkType === "notes")).toBe(true);
  });

  it("skips repeated continuation headers in row chunks and preserves multi-page continuity on merge", () => {
    const merged = mergeMultiPageTables([
      loadFixture("multipage-table"),
      {
        ...loadFixture("multipage-table"),
        tableId: "multipage-table-contd",
        pages: [22],
        pageSpans: [{ page: 22 }],
        rows: [
          { rowIndex: 0, rowType: "header", repeatedHeaderRow: true, cellIds: ["h0", "h1", "h2"], page: 22 },
          { rowIndex: 1, rowType: "body", cellIds: ["r1c0", "r1c1", "r1c2"], page: 22 }
        ],
        cells: [
          { cellId: "h0", rowIndex: 0, colIndex: 0, textRaw: "Port", textNormalized: "Port", isHeader: true, page: 22 },
          { cellId: "h1", rowIndex: 0, colIndex: 1, textRaw: "Average Delay", textNormalized: "Average Delay", isHeader: true, page: 22 },
          { cellId: "h2", rowIndex: 0, colIndex: 2, textRaw: "Primary Cause", textNormalized: "Primary Cause", isHeader: true, page: 22 },
          { cellId: "r1c0", rowIndex: 1, colIndex: 0, textRaw: "Vancouver", textNormalized: "Vancouver", page: 22 },
          { cellId: "r1c1", rowIndex: 1, colIndex: 1, textRaw: "4 days", textNormalized: "4 days", page: 22 },
          { cellId: "r1c2", rowIndex: 1, colIndex: 2, textRaw: "Equipment failure", textNormalized: "Equipment failure", page: 22 }
        ],
        continuity: {
          isMultiPage: true,
          logicalTableGroupId: "shipment-delays",
          continuedFromPreviousPage: true
        }
      }
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.pages).toEqual([20, 21, 22]);

    const rowChunks = buildTableChunks(loadFixture("multipage-table"))
      .filter((chunk) => chunk.chunkType === "row")
      .map((chunk) => chunk.rowIndexes[0]);

    expect(rowChunks).not.toContain(2);
    expect(rowChunks).toEqual([1, 3]);
  });

  it("summary chunk has chunkType, title, sectionPath, pages, and positive tokenEstimate", () => {
    const table = loadFixture("simple-table");
    const chunks = buildTableChunks(table, {
      includeRowChunks: false,
      includeRowGroupChunks: false,
      includeNotesChunk: false,
    });
    const summary = chunks.find((c) => c.chunkType === "summary");
    expect(summary).toBeDefined();
    expect(summary?.chunkType).toBe("summary");
    expect(summary?.title).toBe("Revenue by Quarter");
    expect(summary?.sectionPath).toEqual(["Financial Results", "Q1 2025"]);
    expect(summary?.pages).toEqual([14]);
    expect(summary?.tokenEstimate).toBeGreaterThan(0);
  });

  it("row chunks include inferred header text as cell labels after inferHeaders", () => {
    const raw = loadFixture("simple-table");
    const table = inferHeaders(raw);
    const bodyCells = table.cells.filter((c) => !c.isHeader);
    expect(bodyCells.every((c) => (c.inferredHeaders?.length ?? 0) > 0)).toBe(true);
    const chunks = buildRowChunks(table);
    for (const chunk of chunks) {
      expect(chunk.text).toContain("Quarter:");
    }
  });

  it("row chunks skip rows with repeatedHeaderRow:true", () => {
    const table = loadFixture("multipage-table");
    const chunks = buildRowChunks(table);
    const rowIndexes = chunks.map((c) => c.rowIndexes[0]);
    expect(rowIndexes).not.toContain(0);
    expect(rowIndexes).not.toContain(2);
    expect(rowIndexes).toEqual(expect.arrayContaining([1, 3]));
  });

  it("buildRowGroupChunks produces ceil(bodyRows/groupSize) chunks with correct rowIndexes", () => {
    const table = loadFixture("simple-table");
    const bodyRowCount = table.rows.filter(
      (r) => r.rowType !== "header" && r.rowType !== "note" && !r.repeatedHeaderRow
    ).length;
    const chunks = buildRowGroupChunks(table, 3);
    expect(chunks).toHaveLength(Math.ceil(bodyRowCount / 3));
    expect(chunks[0]?.rowIndexes).toEqual([1, 2]);
  });

  it("notes chunk absent when table has no notes, present and singular when notes exist", () => {
    expect(buildNoteChunks(loadFixture("merged-cells-table"))).toHaveLength(0);
    const noteChunks = buildNoteChunks(loadFixture("simple-table"));
    expect(noteChunks).toHaveLength(1);
    expect(noteChunks[0]?.chunkType).toBe("notes");
  });

  it("includeSummaryChunk:false omits the summary chunk", () => {
    const chunks = buildTableChunks(loadFixture("simple-table"), { includeSummaryChunk: false });
    expect(chunks.some((c) => c.chunkType === "summary")).toBe(false);
  });

  it("includeRowChunks:false omits all row chunks", () => {
    const chunks = buildTableChunks(loadFixture("simple-table"), { includeRowChunks: false });
    expect(chunks.some((c) => c.chunkType === "row")).toBe(false);
  });

  it("row chunk pages reference the row's page, not the full table page list", () => {
    const table = loadFixture("multipage-table");
    const chunks = buildRowChunks(table);
    const chunkForRow3 = chunks.find((c) => c.rowIndexes[0] === 3);
    expect(chunkForRow3).toBeDefined();
    expect(chunkForRow3?.pages).toEqual([21]);
  });

  it("tokenEstimate is a positive integer on every chunk type", () => {
    const chunks = buildTableChunks(loadFixture("simple-table"), { rowGroupSize: 1 });
    for (const chunk of chunks) {
      expect(Number.isInteger(chunk.tokenEstimate)).toBe(true);
      expect(chunk.tokenEstimate).toBeGreaterThan(0);
    }
  });
});
