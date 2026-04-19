# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run lint       # TypeScript type-check (tsc --noEmit), no separate linter
npm test           # run all tests with vitest
npm run build      # compile ESM + CJS bundles via tsup
npm run clean      # remove dist/
```

Run a single test file:
```bash
npx vitest run src/__tests__/chunking.test.ts
```

Tests live in `src/__tests__/` and match `**/*.test.ts`. Fixtures are JSON files in `src/fixtures/`.

## GitHub workflow

- Follow the repository's GitHub Actions workflows in `.github/workflows/`.
- Before opening or updating a PR, run `npm run lint`, `npm test`, and `npm run build` locally. These are the checks enforced by `.github/workflows/ci.yml` on pushes and pull requests to `main`.
- When creating a PR, use `.github/pull_request_template.md` as the source of truth for the PR body.
- Fill out every section in the template:
  - `## Summary`
  - `## Changes`
  - `## Closes`
- The `Closes` section must include a linked GitHub issue using `Closes #<number>`, `Fixes #<number>`, or `Resolves #<number>`. `.github/workflows/pr-issue-check.yml` enforces this on pull requests to `main`.

## Architecture

This is a zero-runtime-dep TypeScript library (only `zod` as a prod dep) that defines a canonical `DocumentTable` JSON model for document-ingestion pipelines. The surface area is:

```
src/
  schema/zod.ts       ← Zod schemas (source of truth for shapes)
  types/              ← TypeScript types inferred/mirrored from zod schemas
  normalize/          ← normalizeTable, inferHeaders, mergeMultiPageTables
  chunk/              ← buildTableChunks, buildRowChunks, buildSummaryChunk, buildNoteChunks
  export/             ← tableToHtml, tableToMarkdown, tableToJson
  utils/              ← guards, ids, text, table sorting helpers
  index.ts            ← single public barrel re-exporting everything
```

### Key design invariants

- **JSON is canonical, Markdown is derived.** Never treat Markdown as the source of truth.
- **`normalizeTable`** accepts messy/unknown input, coerces it via hand-written guard helpers (not Zod), then validates the result through `documentTableSchema.parse()` at the end. This two-phase approach prevents throwing on partial/missing fields during normalization.
- **Cells are addressed by `cellId`** (format: `{tableId}:{rowIndex}:{colIndex}`), rows hold `cellIds[]` references — not inline cell objects.
- **`mergeMultiPageTables`** groups tables by a merge key derived from `continuity.logicalTableGroupId` → title+columns → tableId fallback, then offsets row/cell indexes of continuation pages before merging.
- **Chunking** produces four chunk types: `summary`, `row` (one per body row), `row-group` (N rows batched), and `notes`. Repeated continuation headers are detected and excluded from row chunks by default.
- **`noUncheckedIndexedAccess`** is enabled in tsconfig — all array accesses may return `undefined`, guard accordingly.

### Type/schema duality

`src/types/` mirrors `src/schema/zod.ts`. When adding a field, update both: the Zod schema in `schema/zod.ts` and the corresponding TypeScript type in `types/`. `DocumentTable` is the root type; `TableCell`, `TableRow`, `TableColumn`, `TableContinuity` are its parts.

### Build output

`tsup` emits dual ESM (`dist/index.js`) + CJS (`dist/index.cjs`) with `.d.ts` declarations. `src/index.ts` is the only entry point.

### Session Start

Every session begins by implementing /caveman and /token-efficiency
