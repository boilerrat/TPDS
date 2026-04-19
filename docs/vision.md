# Vision

## Why This Exists

Document ingestion pipelines still break on tables.

This is one of the weakest links in RAG, search, compliance workflows, and document-aware AI systems. PDFs store visual layout, not semantic intent. When extraction tools flatten a table into plain text or weak Markdown, meaning gets damaged.

Rows lose their headers.
Merged cells lose structure.
Multi-page tables split into fragments.
Footnotes detach from values.
Chunking spreads broken content across embeddings.

The result is simple. Retrieval quality drops. Answers get worse. Trust drops.

This project exists to fix that layer.

## Core Belief

A table is not text with lines in between.

A table is a structured information object with relationships between headers, cells, rows, columns, notes, units, and source context.

If those relationships are lost during ingestion, downstream systems inherit the damage.

So the central belief of this project is:

Tables need a canonical, machine-readable, retrieval-aware representation that preserves semantic structure before chunking, indexing, or prompting.

## Long-Term Goal

Create an open standard for table-preserving document ingestion.

The standard should be simple enough for developers to adopt, strict enough to preserve meaning, and flexible enough to work across extraction tools and downstream AI systems.

The first implementation will be an npm package.
The longer-term aim is broader:

- an open schema
- a reference implementation
- adapters for major extraction systems
- validation and conformance tooling
- benchmark fixtures
- eventual community adoption across document AI workflows

## The Problem With Current Approaches

Most current workflows fall into one of these patterns:

### Pattern 1, Plain text flattening

The table becomes a block of text.
Headers and values drift apart.
This is easy to build and hard to trust.

### Pattern 2, Markdown-first conversion

Markdown is readable and convenient.
It is poor as a source of truth for complex tables.

Pipe-table Markdown breaks down when tables include:

- merged cells
- nested headers
- uneven structures
- footnotes
- continuation across pages
- layout-dependent meaning

Markdown helps developers inspect content.
Markdown should not define canonical table structure.

### Pattern 3, Tool-specific JSON

Some extractors produce rich output.
Each tool uses its own shape.
This creates lock-in and makes downstream pipelines brittle.

### Pattern 4, Image-first or OCR-first recovery

This helps in scanned cases.
It often still lacks a stable standard for representing the final logical table.

## The Standard This Project Wants To Create

This project aims to define a stable intermediate layer between extraction and retrieval.

Upstream systems detect and extract.
Downstream systems chunk, embed, index, and answer.
This standard sits in the middle and preserves the table as a logical object.

The standard should define:

- table identity
- cell identity
- row and column structure
- header relationships
- merged cell representation
- notes and footnotes
- units and data hints
- source provenance
- page-level continuity
- optional geometry
- retrieval-oriented chunk derivation

## Design Goals

### 1. Preserve meaning

The standard must preserve the meaning of the table, not only its appearance.

### 2. Stay tool-agnostic

The standard should accept data from many extractors and not depend on one vendor or parser.

### 3. Support provenance

Developers should be able to trace a table and its cells back to source pages and extraction steps.

### 4. Support both humans and machines

Humans need readable exports.
Machines need stable structure.
The standard should support both.

### 5. Treat Markdown as a derivative

Markdown remains useful for readability, debugging, and simple exports.
It should never be treated as the authoritative representation of a complex table.

### 6. Be retrieval-aware from the start

The standard should make chunking easier without forcing meaning to collapse.

### 7. Handle real documents, not ideal documents

The standard should work with:

- scanned PDFs
- OCR noise
- broken page headers
- multi-page tables
- legal and financial tables
- scientific and technical tables
- inconsistent extraction quality

## Philosophy Of Use

This standard is not a parser.
It is not an OCR engine.
It is not a chatbot.
It is not a vector database.

It is a normalization and preservation layer.

That focus matters. The standard wins by staying narrow and reliable.

## What Success Looks Like

This project succeeds when a developer working on document ingestion says:

"I do not care which extractor I used. I can normalize the table into one stable shape, keep its meaning, and build chunks without destroying structure."

It succeeds when teams stop passing broken Markdown tables into embeddings as if that were good enough.

It succeeds when table-aware retrieval becomes standard practice rather than custom glue code.

## Phased Vision

## Phase 1, Reference Package

Build a solid npm package with:

- canonical types
- validation schemas
- normalization helpers
- HTML export
- Markdown export
- chunk builders
- fixture-driven tests

This creates a usable implementation.

## Phase 2, Adapters

Add adapters for major extraction systems such as:

- Docling
- Marker
- custom OCR pipelines
- custom PDF extraction outputs

This creates portability.

## Phase 3, Conformance

Publish:

- JSON Schema
- fixture packs
- validation tools
- conformance tests
- example documents and expected outputs

This creates consistency.

## Phase 4, Evaluation

Develop a benchmark suite for semantic table fidelity.

Evaluation should go beyond surface layout matching and measure whether:

- header relationships are preserved
- merged cells remain meaningful
- notes and footnotes stay attached
- multi-page continuity is retained
- row-wise retrieval remains accurate

This creates rigor.

## Phase 5, Standardization

Move from project to open standard.

Possible future steps:

- public spec site
- open governance
- versioned schema process
- community contribution model
- language ports beyond TypeScript

This creates adoption.

## Principles For Future Contributors

Anyone contributing to this project should follow these rules:

- preserve semantics before readability
- preserve provenance before convenience
- do not flatten structure early
- do not force all tables into Markdown
- do not assume tables end at page boundaries
- do not hide lossy transformations
- prefer explicit structure over smart but opaque magic

## Why npm First

The first implementation belongs on npm because:

- many ingestion and RAG pipelines already use TypeScript or JavaScript
- integration into existing apps becomes easy
- schema validation and transformation workflows are strong in this ecosystem
- package adoption is faster

A Python port or spec-only version may follow later.

## Future Possibilities

This work may expand into a broader family of standards for document objects.

Examples:

- figure-preserving schemas
- citation-aware chunk standards
- canonical section schemas
- layout-aware document exchange formats
- benchmark suites for document-to-RAG pipelines

The first focus remains tables.

## What This Project Refuses To Do

This project will not try to solve every document problem at once.

It will not become bloated.
It will not hide lossy behavior behind pretty exports.
It will not pretend Markdown solves complex tables.
It will not tie the standard to one parser, one model, or one vendor.

## Final Aim

The final aim is simple.

Take one of the most failure-prone objects in document ingestion, the PDF table, and give it a clear, stable, portable standard.

If this works, developers get a cleaner pipeline.
Retrieval gets better.
Answers get better.
Trust goes up.

That is enough reason to build it.