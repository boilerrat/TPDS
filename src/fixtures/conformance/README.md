# TPDS Conformance Fixture Pack

This directory contains input/output snapshot pairs that define the canonical behaviour of the TPDS library.
Third-party implementations can use these fixtures to verify conformance without running the TypeScript source.

## Directory layout

```
conformance/
  <case-name>/
    input.json           DocumentTable JSON (source of truth)
    expected-html.html   Output of tableToHtml(input)
    expected-markdown.md Output of tableToMarkdown(input).markdown
    expected-chunks.json Output of buildTableChunks(input) serialised as a JSON array
```

## Included cases

| Case | Description |
|---|---|
| `simple-table` | Single-page table with headers, body rows, footnotes |
| `merged-cells-table` | Table containing `rowspan`/`colspan` merged cells |
| `multipage-table` | Table spanning multiple pages with continuation rows |
| `wage-schedule-colspan` | EPSCA-derived wage schedule with grouped overtime/double-time headers |
| `wage-schedule-rowspan` | EPSCA-derived wage schedule with trade labels spanning multiple classifications |

## How to use

### Asserting HTML output

```js
const input = JSON.parse(fs.readFileSync("simple-table/input.json", "utf8"));
const expected = fs.readFileSync("simple-table/expected-html.html", "utf8");
assert.strictEqual(yourTableToHtml(input), expected);
```

### Asserting Markdown output

```js
const result = yourTableToMarkdown(input);
assert.strictEqual(result.markdown, expected);
```

### Asserting chunk output

```js
const expected = JSON.parse(fs.readFileSync("simple-table/expected-chunks.json", "utf8"));
assert.deepStrictEqual(yourBuildTableChunks(input), expected);
```

## Updating snapshots

Expected files are committed snapshots. If a change to the library intentionally alters output, regenerate them and commit the new snapshots in the same PR:

```bash
node --input-type=module << 'EOF'
import { readFileSync, writeFileSync } from "node:fs";
import { tableToHtml, tableToMarkdown, buildTableChunks } from "./dist/index.js";

const cases = [
  "simple-table",
  "merged-cells-table",
  "multipage-table",
  "wage-schedule-colspan",
  "wage-schedule-rowspan"
];
const base = "./src/fixtures/conformance";

for (const c of cases) {
  const input = JSON.parse(readFileSync(`${base}/${c}/input.json`, "utf8"));
  writeFileSync(`${base}/${c}/expected-html.html`, tableToHtml(input));
  writeFileSync(`${base}/${c}/expected-markdown.md`, tableToMarkdown(input).markdown);
  writeFileSync(`${base}/${c}/expected-chunks.json`, JSON.stringify(buildTableChunks(input), null, 2) + "\n");
}
EOF
```
