# Roadmap

## Status

The schema, normalization, export, and chunking layers are implemented. The public API is defined.
What remains is hardening test coverage, completing documentation, wiring up publish automation,
and building the conformance and adapter layers that make the standard useful beyond the reference
implementation.

---

## Phase 1 — Test Coverage & Fixture Completeness

**Goal:** every codepath has meaningful test coverage; every documented edge case has a fixture.

### Fixtures still needed

| Fixture | Edge case covered |
|---|---|
| `footnotes-table.json` | footnotes and notes attached to cells |
| `wide-table.json` | many columns, Markdown pipe-table overflow |
| `ocr-noisy-table.json` | dirty `textRaw`, normalized `textNormalized` differ |
| `repeated-headers-table.json` | continuation page headers marked as repeated |
| `financial-table.json` | numeric values, currency, percent, units |
| `nested-headers-table.json` | `headerGroups` with multi-level column spans |

### Test suites to complete

- **normalize.test.ts** — edge cases: missing rows array (derived from cells), missing columns
  (inferred), page derivation from cell/row, continuity auto-set, repeated header detection,
  invalid inputs that should throw
- **export-html.test.ts** — `rowspan`/`colspan` attributes, `<caption>`, `<tfoot>` for footer rows,
  footnotes rendered outside `<table>`, empty table
- **export-markdown.test.ts** — lossy flag set for merged-cell tables, wide table fallback to
  structured text, simple table round-trip fidelity
- **chunking.test.ts** — summary chunk field completeness, row chunks carry inferred headers,
  row-group batching boundaries, notes chunk only emitted when notes exist, multi-page table
  chunks reference correct pages
- **merge-multipage.test.ts** — new file: merge by `logicalTableGroupId`, merge by title+columns,
  row index offset correctness, page list deduplication, single-table passthrough

**Acceptance criteria:**
- All fixture files pass `validateTable` without error
- `npm test` green with ≥ 80 meaningful assertions across all suites
- Every exported function is exercised by at least one failing-input test

---

## Phase 2 — Publish Readiness

**Goal:** the package can be published to npm and consumed cleanly by downstream projects.

- Add `npm publish` GitHub Actions workflow triggered on version tag (`v*.*.*`)
- Verify dual ESM + CJS output works in a minimal consumer smoke test
- Add `CHANGELOG.md` following Keep a Changelog format
- Audit and lock the public API surface — nothing in `index.ts` that shouldn't be public
- Confirm `package.json` `exports`, `main`, `module`, `types` fields are correct
- Add `.npmignore` or `files` field so only `dist/` and `README.md` ship

**Acceptance criteria:**
- `npm pack` produces a tarball with only `dist/` and `README.md`
- A fresh `npm install` of the packed tarball can import all public exports in both ESM and CJS
- Publish workflow fires only on `v*.*.*` tags, not on every push

---

## Phase 3 — Documentation

**Goal:** a developer new to the project can understand the schema and start using the package
without reading source code.

- **`docs/schema.md`** — full field-level reference for every type: purpose, constraints,
  optionality, example values
- **`docs/examples.md`** — end-to-end worked examples: Docling-style input → normalize → chunk,
  multi-page merge, HTML render, Markdown with lossy flag
- **`CONTRIBUTING.md`** — issue-first workflow, branch naming, test requirements, fixture
  conventions, PR checklist
- **`README.md`** — expand motivation section, add full API reference table, add chunking output
  example, link to schema and examples docs

**Acceptance criteria:**
- schema.md covers every field in `DocumentTable`, `TableCell`, `TableRow`, `TableColumn`,
  `TableChunk`
- examples.md contains at least three complete end-to-end code examples
- CONTRIBUTING.md references the PR template and CI requirements

---

## Phase 4 — Quality Flags & Conformance

**Goal:** consumers can detect degraded table fidelity and validate their own implementations
against a published standard.

- Add optional `fidelityWarnings` array to `DocumentTable` schema — values such as
  `merged-cells-present`, `markdown-lossy`, `headers-inferred`, `ocr-noise-detected`
- Add `addFidelityWarnings(table)` utility that analyses the table and populates the field
- Publish machine-readable JSON Schema (`json-schema.org` draft-07 compatible) at
  `dist/schema.json`, exported as a package asset
- Add conformance fixture pack: each fixture paired with expected HTML, Markdown, and chunk
  outputs, suitable for third-party implementations to validate against
- Document schema versioning policy: semantic versioning for `standardVersion`, breaking changes
  require major bump, additive fields are minor

**Acceptance criteria:**
- `fidelityWarnings` is populated correctly for all existing fixtures that have known lossy cases
- `dist/schema.json` validates against the meta-schema
- Conformance fixtures are in `src/fixtures/conformance/` with a README describing expected outputs

---

## Phase 5 — Adapters

**Goal:** developers using real extraction tools can normalize their output in one call without
writing custom mapping code.

Each adapter takes tool-specific output and returns a `DocumentTable` by calling `normalizeTable`
internally. Adapters live in `src/adapters/`.

| Adapter | Input format |
|---|---|
| `normalizeFromDocling` | Docling `TableItem` JSON |
| `normalizeFromMarker` | Marker table block JSON |
| `normalizeFromFlatArray` | `string[][]` rows with optional header row flag |

**Acceptance criteria:**
- Each adapter has its own test file with at least one real-world-shaped fixture
- Adapters are exported from `index.ts` alongside the core API
- Adapters do not add new required peer dependencies

---

## Phase 6 — CLI

**Goal:** non-TypeScript pipelines can use TPDS as a command-line tool.

Commands:
- `tpds validate <file.json>` — exits 0 if valid, 1 with error messages if not
- `tpds normalize <file.json> [--output file.json]` — normalize and write canonical form
- `tpds export <file.json> --format html|markdown|json` — print export to stdout

Delivered as a `bin` entry in `package.json`. No additional runtime dependencies.

**Acceptance criteria:**
- All three commands work via `npx table-preserving-doc-standard`
- CLI has its own test file exercising each command with fixture inputs
- `tpds --help` prints usage for each command

---

## Phase 7 — Benchmark & Evaluation

**Goal:** measure and demonstrate semantic fidelity preservation across the pipeline.

- Benchmark suite that takes a table fixture + expected chunk output and scores whether
  header relationships, merged cell context, and page provenance are preserved
- Score reported as `fidelityScore` (0–1) across dimensions: headers, merges, provenance, notes
- Published results for all built-in fixtures in `docs/benchmark-results.md`
- Scoping document for Python port (`docs/python-port.md`)

**Acceptance criteria:**
- Benchmark runs via `npm run benchmark`
- All built-in fixtures score ≥ 0.9 on all dimensions
- Python port scoping doc describes the mapping from TypeScript types to Pydantic models

---

## Phase 8 — Open Standard

**Goal:** move from a single-maintainer project toward a governed open standard.

- Public spec site (GitHub Pages or similar) with versioned schema docs
- Formal `standardVersion` bump process documented in `CONTRIBUTING.md`
- Community contribution model: issue templates for schema proposals, breaking-change process
- Language ports beyond TypeScript tracked as separate repos under a shared org

This phase has no fixed timeline and depends on adoption.

---

## What Is Complete

| Item | Status |
|---|---|
| Zod schema + TypeScript types | done |
| `normalizeTable` | done |
| `inferHeaders` | done |
| `mergeMultiPageTables` | done |
| HTML export | done |
| Markdown export (with lossy flag) | done |
| JSON export | done |
| `buildTableChunks` (all four chunk types) | done |
| 4 base fixtures | done |
| CI workflow (lint, test, build, PR issue check) | done |
| Branch protection | done |
| Issue-based PR workflow | done |
