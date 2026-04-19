import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { DocumentTable } from "../types/table";
import { tableToHtml, tableToMarkdown, buildTableChunks } from "../index";

const conformanceDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "conformance"
);

const cases = readdirSync(conformanceDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe("conformance fixtures", () => {
  it("includes the EPSCA-derived wage schedule cases", () => {
    expect(cases).toEqual(
      expect.arrayContaining(["wage-schedule-colspan", "wage-schedule-rowspan"])
    );
  });

  it.each(cases)("%s — expected-html.html matches tableToHtml output", (caseName) => {
    const dir = path.join(conformanceDir, caseName);
    const input = JSON.parse(readFileSync(path.join(dir, "input.json"), "utf8")) as DocumentTable;
    const expected = readFileSync(path.join(dir, "expected-html.html"), "utf8");
    expect(tableToHtml(input)).toBe(expected);
  });

  it.each(cases)("%s — expected-markdown.md matches tableToMarkdown output", (caseName) => {
    const dir = path.join(conformanceDir, caseName);
    const input = JSON.parse(readFileSync(path.join(dir, "input.json"), "utf8")) as DocumentTable;
    const expected = readFileSync(path.join(dir, "expected-markdown.md"), "utf8");
    expect(tableToMarkdown(input).markdown).toBe(expected);
  });

  it.each(cases)("%s — expected-chunks.json matches buildTableChunks output", (caseName) => {
    const dir = path.join(conformanceDir, caseName);
    const input = JSON.parse(readFileSync(path.join(dir, "input.json"), "utf8")) as DocumentTable;
    const expected = JSON.parse(readFileSync(path.join(dir, "expected-chunks.json"), "utf8"));
    expect(buildTableChunks(input)).toEqual(expected);
  });
});
