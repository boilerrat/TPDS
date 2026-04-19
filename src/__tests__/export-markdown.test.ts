import { describe, expect, it } from "vitest";

import { tableToMarkdown } from "../index";
import type { DocumentTable } from "../types/table";
import { loadFixture } from "./helpers";

describe("tableToMarkdown", () => {
  it("emits pipe-table header row for simple table", () => {
    const result = tableToMarkdown(loadFixture("simple-table"));
    expect(result.fidelity).toBe("lossless");
    expect(result.markdown).toMatch(/\| Quarter \|/);
    expect(result.markdown).toMatch(/\|[\s-]+\|/);
  });

  it("reports lossy fidelity for merged-cell tables", () => {
    const result = tableToMarkdown(loadFixture("merged-cells-table"));
    expect(result.fidelity).toBe("lossy");
    expect(result.warnings).toContain("markdown-lossy-fallback");
  });

  it("falls back to structured text for wide tables (10+ cols)", () => {
    const result = tableToMarkdown(loadFixture("wide-table"));
    expect(result.fidelity).toBe("lossy");
    expect(result.markdown).not.toMatch(/\|[-\s]+\|/);
  });

  it("reports lossy and emits no pipe-table separator for broken-markdown-case", () => {
    const result = tableToMarkdown(loadFixture("broken-markdown-case"));
    expect(result.fidelity).toBe("lossy");
    expect(result.markdown).not.toMatch(/\|---/);
    expect(result.markdown).toContain("Clinical Trial Outcomes");
  });

  it("produces valid markdown for body-only tables without throwing", () => {
    const bodyOnly: DocumentTable = {
      standardVersion: "1.0.0",
      tableId: "body-only-test",
      pages: [1],
      columns: [
        { colIndex: 0, label: "Name" },
        { colIndex: 1, label: "Value" },
      ],
      rows: [
        { rowIndex: 0, rowType: "body", cellIds: ["c0", "c1"], page: 1 },
        { rowIndex: 1, rowType: "body", cellIds: ["c2", "c3"], page: 1 },
      ],
      cells: [
        { cellId: "c0", rowIndex: 0, colIndex: 0, textRaw: "Alpha", textNormalized: "Alpha", page: 1 },
        { cellId: "c1", rowIndex: 0, colIndex: 1, textRaw: "1", textNormalized: "1", page: 1 },
        { cellId: "c2", rowIndex: 1, colIndex: 0, textRaw: "Beta", textNormalized: "Beta", page: 1 },
        { cellId: "c3", rowIndex: 1, colIndex: 1, textRaw: "2", textNormalized: "2", page: 1 },
      ],
    };
    let result: ReturnType<typeof tableToMarkdown> | undefined;
    expect(() => {
      result = tableToMarkdown(bodyOnly);
    }).not.toThrow();
    expect(typeof result?.markdown).toBe("string");
  });

  it("appends footnotes below pipe-table body", () => {
    const result = tableToMarkdown(loadFixture("footnotes-table"));
    expect(result.fidelity).toBe("lossless");
    expect(result.markdown).toContain("Adjusted for age and sex");
    expect(result.markdown).toContain("Excludes outliers beyond 3 SD");
  });
});
