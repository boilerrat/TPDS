import { describe, expect, it } from "vitest";

import { tableToMarkdown } from "../index";
import { loadFixture } from "./helpers";

describe("tableToMarkdown", () => {
  it("emits pipe-table markdown for simple tables", () => {
    const markdown = tableToMarkdown(loadFixture("simple-table"));
    expect(markdown.fidelity).toBe("lossless");
    expect(markdown.markdown).toContain("| Quarter | Region | Revenue | Operating Margin |");
  });

  it("falls back for merged or complex headers", () => {
    const markdown = tableToMarkdown(loadFixture("broken-markdown-case"));
    expect(markdown.fidelity).toBe("lossy");
    expect(markdown.warnings).toContain("markdown-lossy-fallback");
    expect(markdown.markdown).toContain("Table: Clinical Trial Outcomes");
  });
});
