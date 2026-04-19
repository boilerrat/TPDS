# Project Brief

## Project Name

table-preserving-doc-standard

Working short name: TPDS

## Purpose

Build an open standard and TypeScript package for preserving table structure from PDFs and other documents during ingestion for RAG, search, and chat systems.

The package should solve a common failure point in document pipelines:

PDF tables often lose structure during extraction.
Markdown alone often damages row and column meaning.
Chunking then spreads broken table text across embeddings.
Retrieval quality drops.
Answers become unreliable.

This project will define a canonical table representation and provide tools to convert extracted table data into a standard format suitable for ingestion, chunking, retrieval, and rendering.

## Core Idea

Markdown is an output format, not the source of truth.

The source of truth for tables should be a structured schema that preserves:

- logical rows and columns
- header relationships
- merged cells
- captions
- footnotes
- page provenance
- document section context
- multi-page table continuity
- optional geometry metadata

The package should expose a standard schema and utilities for:

- validation
- serialization
- chunk generation
- Markdown export
- HTML export
- row-wise retrieval preparation

## End Goal

Publish an npm package that I can import into document ingestion projects.

The package should let me take table extraction output from tools like Docling, Marker, OCR pipelines, or custom parsers, normalize that output into one standard shape, and then prepare table-aware chunks for downstream RAG workflows.

## Users

Primary users:

- developers building document ingestion pipelines
- RAG engineers
- search engineers
- AI agent developers
- teams handling PDFs with dense tabular content

Secondary users:

- data extraction teams
- compliance and legal document pipeline teams
- knowledge base platform builders

## Problem Statement

Most document ingestion pipelines treat tables like text blocks. That breaks meaning.

Examples of failure:

- headers detached from values
- rows split across chunks
- merged cells flattened badly
- repeated page headers mixed into content
- footnotes lost
- multi-page tables treated as separate unrelated fragments
- Markdown tables produced even when source layout does not map cleanly to Markdown

This project should provide a stable intermediate representation for tables, separate from extraction and separate from LLM prompting.

## What This Project Is

This project is:

- a schema standard
- a normalization layer
- a TypeScript package
- a validation toolkit
- a chunking helper for RAG systems
- a rendering/export layer

## What This Project Is Not

This project is not:

- a PDF parser
- an OCR engine
- a full document processing platform
- a vector database
- an end-user chatbot

Extraction belongs upstream.
Retrieval belongs downstream.

This package sits in the middle.

## Design Principles

1. Structure first  
Preserve table meaning before optimizing for readability.

2. Provenance always  
Every table and cell should retain source traceability.

3. Markdown is derived  
Markdown should be generated from the structured source, never treated as canonical.

4. Multi-page aware  
A logical table may span multiple pages and still remain one table object.

5. Retrieval aware  
The schema should support chunk generation without losing table semantics.

6. Renderer neutral  
The standard should support HTML, Markdown, JSON, and future formats.

7. Tool agnostic  
The standard should accept output from many extractors.

## MVP Scope

### In scope

- define canonical JSON schema for tables
- define TypeScript types
- define Zod validation schemas
- create normalization utilities
- create HTML export
- create Markdown export
- create row-wise chunk generation
- create header-aware chunk generation
- create test fixtures
- publish npm package

### Out of scope for MVP

- direct PDF parsing
- OCR
- visual table detection
- model training
- browser UI
- hosted API service

## Canonical Table Schema

The package should define the following main entities.

### DocumentTable

```ts
type DocumentTable = {
  standardVersion: string
  tableId: string
  sourceDocumentId?: string
  sourceFileName?: string

  title?: string
  caption?: string
  sectionPath?: string[]
  notes?: string[]
  footnotes?: string[]

  pages: number[]
  pageSpans?: Array<{
    page: number
    bbox?: BoundingBox
  }>

  columns: TableColumn[]
  rows: TableRow[]
  cells: TableCell[]

  headerGroups?: HeaderGroup[]
  metadata?: Record<string, unknown>

  continuity?: {
    isMultiPage: boolean
    continuedFromPreviousPage?: boolean
    continuesOnNextPage?: boolean
    logicalTableGroupId?: string
  }

  provenance?: Provenance[]
}
````

### TableCell

```ts
type TableCell = {
  cellId: string
  rowIndex: number
  colIndex: number

  textRaw: string
  textNormalized: string

  isHeader?: boolean
  headerLevel?: number

  rowSpan?: number
  colSpan?: number

  inferredHeaders?: string[]
  units?: string
  valueType?: "text" | "number" | "currency" | "percent" | "date" | "boolean" | "mixed"

  bbox?: BoundingBox
  page?: number

  sourceRefs?: SourceRef[]
  metadata?: Record<string, unknown>
}
```

### TableRow

```ts
type TableRow = {
  rowIndex: number
  rowType?: "header" | "body" | "footer" | "note"
  cellIds: string[]
  page?: number
  repeatedHeaderRow?: boolean
}
```

### TableColumn

```ts
type TableColumn = {
  colIndex: number
  label?: string
  inferredLabelPath?: string[]
  units?: string
  metadata?: Record<string, unknown>
}
```

### HeaderGroup

```ts
type HeaderGroup = {
  groupId: string
  label: string
  level: number
  colStart: number
  colEnd: number
}
```

### BoundingBox

```ts
type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
  coordinateSpace?: "pdf" | "image" | "normalized"
}
```

### SourceRef

```ts
type SourceRef = {
  page: number
  extractor?: string
  extractorVersion?: string
  confidence?: number
}
```

### Provenance

```ts
type Provenance = {
  step: string
  tool?: string
  version?: string
  timestamp?: string
  notes?: string
}
```

## Normalization Rules

The package should implement clear normalization rules.

### Rule 1

Keep both `textRaw` and `textNormalized`.

### Rule 2

Preserve merged cells using `rowSpan` and `colSpan`.

### Rule 3

If repeated header rows appear on later pages, mark them as repeated headers, not new logical data rows.

### Rule 4

If a table spans pages, keep one logical table object when continuity is clear.

### Rule 5

Attach inferred headers to body cells when possible.

### Rule 6

Do not force Markdown compatibility at normalization time.

### Rule 7

Store page and optional bounding box data for audit and debugging.

## Export Formats

### JSON Export

This is the source of truth.

### HTML Export

Generate semantically correct HTML table output where possible.

Requirements:

* use `table`
* use `thead`, `tbody`, `tfoot` when relevant
* preserve `rowspan` and `colspan`
* include caption when present
* include notes and footnotes outside the table element where appropriate

### Markdown Export

Generate best-effort Markdown output.

Rules:

* only output pipe-table Markdown for simple tables
* if the table contains merged cells or complex multi-row headers, fall back to a structured text representation
* include a warning flag in metadata when Markdown fidelity is lossy

## Chunking Strategy

The package should include chunk builders for retrieval.

### Chunk types

1. Table summary chunk
   Contains title, caption, section path, page range, and column headers.

2. Row-wise chunks
   Each row serialized with inherited headers.

3. Row-group chunks
   Useful for wide or long tables.

4. Notes chunk
   Contains footnotes, notes, units, and interpretation hints.

### Row serialization format

Each row chunk should look like this:

```txt
Table: Revenue by Quarter
Section: Financial Results > Q1 2025
Page Range: 14-15

Row 12
Quarter: Q1 2025
Region: North America
Revenue: 12.4M
Operating Margin: 18%
Notes: Preliminary figures
```

### Chunk metadata

Each chunk should include:

* chunkId
* tableId
* chunkType
* rowIndexes
* pages
* sectionPath
* title
* caption
* tokenEstimate
* sourceRefs

## Package API Goals

The public API should feel simple.

Example target API:

```ts
import {
  validateTable,
  normalizeTable,
  tableToHtml,
  tableToMarkdown,
  buildTableChunks,
  mergeMultiPageTables
} from "table-preserving-doc-standard"
```

Potential API shapes:

```ts
validateTable(input)
normalizeTable(rawExtractorOutput, options)
mergeMultiPageTables(tables, options)
tableToHtml(table, options)
tableToMarkdown(table, options)
buildTableChunks(table, options)
inferHeaders(table, options)
```

## Repo Structure

```txt
table-preserving-doc-standard/
  src/
    index.ts
    types/
      table.ts
      chunk.ts
      provenance.ts
    schema/
      zod.ts
    normalize/
      normalize-table.ts
      merge-multipage.ts
      infer-headers.ts
    export/
      to-html.ts
      to-markdown.ts
      to-json.ts
    chunk/
      build-row-chunks.ts
      build-summary-chunk.ts
      build-note-chunks.ts
    utils/
      ids.ts
      text.ts
      geometry.ts
    fixtures/
      simple-table.json
      merged-cells-table.json
      multipage-table.json
      broken-markdown-case.json
    __tests__/
      normalize.test.ts
      export-html.test.ts
      export-markdown.test.ts
      chunking.test.ts
  docs/
    spec.md
    schema.md
    examples.md
    roadmap.md
  package.json
  tsconfig.json
  README.md
```

## Tech Stack

* TypeScript
* Node.js
* Zod for schema validation
* Vitest or Jest for tests
* tsup or unbuild for packaging
* ESLint
* Prettier

## Initial Milestones

### Milestone 1, Schema Foundation

* define types
* define validation schemas
* create fixture set
* write base tests

### Milestone 2, Normalization

* accept raw table input
* normalize cells, rows, columns
* attach provenance
* support merged cells
* support multi-page continuity markers

### Milestone 3, Exports

* HTML export
* Markdown export
* JSON export

### Milestone 4, Chunking

* summary chunks
* row-wise chunks
* row-group chunks
* notes chunks

### Milestone 5, Package Readiness

* polish API
* docs
* examples
* npm publish setup

## Acceptance Criteria

MVP is complete when:

* a raw extracted table object can be normalized into the canonical schema
* the normalized schema passes validation
* complex tables with merged cells do not lose structure in JSON or HTML
* Markdown export marks lossy cases
* row-wise chunk output preserves header context
* multi-page tables merge into one logical object where continuity is clear
* fixtures and tests cover common failure cases
* package is ready for npm publish

## Test Fixtures Required

Create fixtures for at least these cases:

1. simple clean table
2. table with merged cells
3. multi-row header table
4. multi-page continued table
5. table with footnotes
6. wide table
7. table where Markdown export is lossy
8. OCR-noisy table
9. repeated page header rows
10. numeric financial table with units

## Future Roadmap

After MVP:

* adapters for Docling output
* adapters for Marker output
* adapters for custom OCR pipelines
* scoring and quality flags
* schema extension for non-table layout objects
* optional Python package mirror
* benchmark suite for extraction fidelity
* CLI tool for normalization and export
* JSON Schema publication
* formal open standard documentation site

## README Direction

The README should explain:

* why PDF tables break ingestion
* why Markdown is not enough
* what the canonical schema solves
* basic usage examples
* export examples
* chunking examples
* roadmap and contribution guide

## Publishing Goal

Publish to npm under a clean package name if available.

Preferred names to check:

* table-preserving-doc-standard
* table-canonical
* canonical-table-schema
* rag-table-standard
* table-normalization-kit

## Contribution Standard

All code should be:

* strongly typed
* documented
* tested
* modular
* extractor-agnostic

## Immediate Tasks For Codex

1. initialize repo
2. build TypeScript package scaffold
3. define core types
4. define Zod schema
5. add fixtures
6. write validation tests
7. implement HTML export
8. implement Markdown export
9. implement chunk builders
10. write README and docs
11. prepare npm publish config

## Notes For Codex

Do not build a PDF parser.
Do not build OCR.
Focus on the schema, normalization, export, and chunking layer.
Preserve semantic fidelity over convenience.
Treat Markdown as a derived format, not canonical storage.
Prefer small pure functions.
Keep the public API minimal and stable.


