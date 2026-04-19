import { describe, expect, it } from "vitest";

import { buildTableChunks, mergeMultiPageTables } from "../index";
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
});
