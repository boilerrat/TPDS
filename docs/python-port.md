# Python Port Scoping Document

This document scopes a `tpds-python` package that mirrors the TypeScript TPDS library for use in Python document-ingestion pipelines.

---

## 1. Type Mapping Table

### Primitive and Utility Types

| TypeScript | Python (Pydantic v2) |
|---|---|
| `string` | `str` |
| `number` | `int` \| `float` (contextual) |
| `boolean` | `bool` |
| `string[]` | `list[str]` |
| `number[]` | `list[int]` |
| `unknown` | `Any` (with Pydantic validation at boundary) |
| `Record<string, unknown>` (`JsonRecord`) | `dict[str, Any]` |
| `T \| undefined` (optional field) | `Optional[T]` (field default `None`) |
| `T[]` | `list[T]` |

### Schema / Validation Layer

| TypeScript | Python |
|---|---|
| Zod schema (`z.object(...)`) | `pydantic.BaseModel` subclass |
| `z.enum(...)` | `Literal[...]` or `StrEnum` (Python ≥ 3.11) |
| `z.union(...)` | `Union[A, B]` or `A \| B` (Python ≥ 3.10) |
| `z.literal(...)` | `Literal[value]` |
| `z.string()` | `str` |
| `z.number()` | `float` or `int` with `Field` constraints |
| `z.boolean()` | `bool` |
| `z.array(T)` | `list[T]` |
| `z.record(z.unknown())` | `dict[str, Any]` |
| `z.optional(T)` | `Optional[T]` |
| `documentTableSchema.parse(input)` | `DocumentTable.model_validate(input)` |
| `documentTableSchema.safeParse(input)` | `DocumentTable.model_validate(input)` wrapped in `try/except ValidationError` |

### `common.ts` Types

| TypeScript type | Python equivalent |
|---|---|
| `CoordinateSpace = "pdf" \| "image" \| "normalized"` | `Literal["pdf", "image", "normalized"]` |
| `ValueType = "text" \| "number" \| ...` | `Literal["text", "number", "currency", "percent", "date", "boolean", "mixed"]` |
| `RowType = "header" \| "body" \| "footer" \| "note"` | `Literal["header", "body", "footer", "note"]` |
| `JsonRecord = Record<string, unknown>` | `dict[str, Any]` (type alias) |
| `BoundingBox` | `class BoundingBox(BaseModel)` |
| `BoundingBox.x: number` | `x: float` |
| `BoundingBox.y: number` | `y: float` |
| `BoundingBox.width: number` | `width: float` |
| `BoundingBox.height: number` | `height: float` |
| `BoundingBox.coordinateSpace?: CoordinateSpace` | `coordinate_space: Optional[Literal["pdf", "image", "normalized"]] = None` |
| `SourceRef` | `class SourceRef(BaseModel)` |
| `SourceRef.page: number` | `page: int` |
| `SourceRef.extractor?: string` | `extractor: Optional[str] = None` |
| `SourceRef.extractorVersion?: string` | `extractor_version: Optional[str] = None` |
| `SourceRef.confidence?: number` | `confidence: Optional[float] = None` |
| `Provenance` | `class Provenance(BaseModel)` |
| `Provenance.step: string` | `step: str` |
| `Provenance.tool?: string` | `tool: Optional[str] = None` |
| `Provenance.version?: string` | `version: Optional[str] = None` |
| `Provenance.timestamp?: string` | `timestamp: Optional[str] = None` |
| `Provenance.notes?: string` | `notes: Optional[str] = None` |

### `table.ts` Types

| TypeScript type | Python equivalent |
|---|---|
| `TableColumn` | `class TableColumn(BaseModel)` |
| `TableColumn.colIndex: number` | `col_index: int` |
| `TableColumn.label?: string` | `label: Optional[str] = None` |
| `TableColumn.inferredLabelPath?: string[]` | `inferred_label_path: Optional[list[str]] = None` |
| `TableColumn.units?: string` | `units: Optional[str] = None` |
| `TableColumn.metadata?: JsonRecord` | `metadata: Optional[dict[str, Any]] = None` |
| `HeaderGroup` | `class HeaderGroup(BaseModel)` |
| `HeaderGroup.groupId: string` | `group_id: str` |
| `HeaderGroup.label: string` | `label: str` |
| `HeaderGroup.level: number` | `level: int` |
| `HeaderGroup.colStart: number` | `col_start: int` |
| `HeaderGroup.colEnd: number` | `col_end: int` |
| `TableCell` | `class TableCell(BaseModel)` |
| `TableCell.cellId: string` | `cell_id: str` |
| `TableCell.rowIndex: number` | `row_index: int` |
| `TableCell.colIndex: number` | `col_index: int` |
| `TableCell.textRaw: string` | `text_raw: str` |
| `TableCell.textNormalized: string` | `text_normalized: str` |
| `TableCell.isHeader?: boolean` | `is_header: Optional[bool] = None` |
| `TableCell.headerLevel?: number` | `header_level: Optional[int] = None` |
| `TableCell.rowSpan?: number` | `row_span: Optional[int] = None` |
| `TableCell.colSpan?: number` | `col_span: Optional[int] = None` |
| `TableCell.inferredHeaders?: string[]` | `inferred_headers: Optional[list[str]] = None` |
| `TableCell.units?: string` | `units: Optional[str] = None` |
| `TableCell.valueType?: ValueType` | `value_type: Optional[ValueType] = None` |
| `TableCell.bbox?: BoundingBox` | `bbox: Optional[BoundingBox] = None` |
| `TableCell.page?: number` | `page: Optional[int] = None` |
| `TableCell.sourceRefs?: SourceRef[]` | `source_refs: Optional[list[SourceRef]] = None` |
| `TableCell.metadata?: JsonRecord` | `metadata: Optional[dict[str, Any]] = None` |
| `TableRow` | `class TableRow(BaseModel)` |
| `TableRow.rowIndex: number` | `row_index: int` |
| `TableRow.rowType?: RowType` | `row_type: Optional[RowType] = None` |
| `TableRow.cellIds: string[]` | `cell_ids: list[str]` |
| `TableRow.page?: number` | `page: Optional[int] = None` |
| `TableRow.repeatedHeaderRow?: boolean` | `repeated_header_row: Optional[bool] = None` |
| `PageSpan` | `class PageSpan(BaseModel)` |
| `PageSpan.page: number` | `page: int` |
| `PageSpan.bbox?: BoundingBox` | `bbox: Optional[BoundingBox] = None` |
| `TableContinuity` | `class TableContinuity(BaseModel)` |
| `TableContinuity.isMultiPage: boolean` | `is_multi_page: bool` |
| `TableContinuity.continuedFromPreviousPage?: boolean` | `continued_from_previous_page: Optional[bool] = None` |
| `TableContinuity.continuesOnNextPage?: boolean` | `continues_on_next_page: Optional[bool] = None` |
| `TableContinuity.logicalTableGroupId?: string` | `logical_table_group_id: Optional[str] = None` |
| `FidelityWarning` (string union) | `Literal["merged-cells-present", "headers-inferred", "markdown-lossy", "repeated-headers-detected", "ocr-noise-suspected", "multi-page-merged"]` |
| `DocumentTable` | `class DocumentTable(BaseModel)` |
| `DocumentTable.standardVersion: string` | `standard_version: str` |
| `DocumentTable.tableId: string` | `table_id: str` |
| `DocumentTable.sourceDocumentId?: string` | `source_document_id: Optional[str] = None` |
| `DocumentTable.sourceFileName?: string` | `source_file_name: Optional[str] = None` |
| `DocumentTable.title?: string` | `title: Optional[str] = None` |
| `DocumentTable.caption?: string` | `caption: Optional[str] = None` |
| `DocumentTable.sectionPath?: string[]` | `section_path: Optional[list[str]] = None` |
| `DocumentTable.notes?: string[]` | `notes: Optional[list[str]] = None` |
| `DocumentTable.footnotes?: string[]` | `footnotes: Optional[list[str]] = None` |
| `DocumentTable.pages: number[]` | `pages: list[int]` |
| `DocumentTable.pageSpans?: PageSpan[]` | `page_spans: Optional[list[PageSpan]] = None` |
| `DocumentTable.columns: TableColumn[]` | `columns: list[TableColumn]` |
| `DocumentTable.rows: TableRow[]` | `rows: list[TableRow]` |
| `DocumentTable.cells: TableCell[]` | `cells: list[TableCell]` |
| `DocumentTable.headerGroups?: HeaderGroup[]` | `header_groups: Optional[list[HeaderGroup]] = None` |
| `DocumentTable.metadata?: JsonRecord` | `metadata: Optional[dict[str, Any]] = None` |
| `DocumentTable.continuity?: TableContinuity` | `continuity: Optional[TableContinuity] = None` |
| `DocumentTable.provenance?: Provenance[]` | `provenance: Optional[list[Provenance]] = None` |
| `DocumentTable.fidelityWarnings?: FidelityWarning[]` | `fidelity_warnings: Optional[list[FidelityWarning]] = None` |

### `chunk.ts` Types

| TypeScript type | Python equivalent |
|---|---|
| `TableChunkType = "summary" \| "row" \| "row-group" \| "notes"` | `Literal["summary", "row", "row-group", "notes"]` |
| `TableChunk` | `class TableChunk(BaseModel)` |
| `TableChunk.chunkId: string` | `chunk_id: str` |
| `TableChunk.tableId: string` | `table_id: str` |
| `TableChunk.chunkType: TableChunkType` | `chunk_type: TableChunkType` |
| `TableChunk.text: string` | `text: str` |
| `TableChunk.rowIndexes: number[]` | `row_indexes: list[int]` |
| `TableChunk.pages: number[]` | `pages: list[int]` |
| `TableChunk.sectionPath?: string[]` | `section_path: Optional[list[str]] = None` |
| `TableChunk.title?: string` | `title: Optional[str] = None` |
| `TableChunk.caption?: string` | `caption: Optional[str] = None` |
| `TableChunk.tokenEstimate: number` | `token_estimate: int` |
| `TableChunk.sourceRefs: SourceRef[]` | `source_refs: list[SourceRef]` |
| `TableChunk.metadata?: Record<string, unknown>` | `metadata: Optional[dict[str, Any]] = None` |
| `BuildRowChunksOptions.includeRepeatedHeaders?: boolean` | `include_repeated_headers: bool = False` |
| `BuildTableChunksOptions.rowGroupSize?: number` | `row_group_size: Optional[int] = None` |
| `BuildTableChunksOptions.includeSummaryChunk?: boolean` | `include_summary_chunk: bool = True` |
| `BuildTableChunksOptions.includeRowChunks?: boolean` | `include_row_chunks: bool = True` |
| `BuildTableChunksOptions.includeRowGroupChunks?: boolean` | `include_row_group_chunks: bool = False` |
| `BuildTableChunksOptions.includeNotesChunk?: boolean` | `include_notes_chunk: bool = True` |
| `MarkdownExportResult` | `class MarkdownExportResult(BaseModel)` |
| `MarkdownExportResult.markdown: string` | `markdown: str` |
| `MarkdownExportResult.fidelity: "lossless" \| "lossy"` | `fidelity: Literal["lossless", "lossy"]` |
| `MarkdownExportResult.warnings: string[]` | `warnings: list[str]` |

### Adapter Option Types

| TypeScript type | Python equivalent |
|---|---|
| `NormalizeTableOptions.standardVersion?: string` | `standard_version: Optional[str] = None` |
| `NormalizeTableOptions.inferHeaders?: boolean` | `infer_headers: bool = True` |
| `FlatArrayAdapterOptions.firstRowIsHeader?: boolean` | `first_row_is_header: bool = True` |
| `FlatArrayAdapterOptions.tableId?: string` | `table_id: Optional[str] = None` |
| `FlatArrayAdapterOptions.title?: string` | `title: Optional[str] = None` |
| `FlatArrayAdapterOptions.sectionPath?: string[]` | `section_path: Optional[list[str]] = None` |
| `FlatArrayAdapterOptions.pages?: number[]` | `pages: list[int] = [1]` |
| `NormalizeDoclingOptions.tableId?: string` | `table_id: Optional[str] = None` |
| `NormalizeDoclingOptions.title?: string` | `title: Optional[str] = None` |
| `NormalizeDoclingOptions.caption?: string` | `caption: Optional[str] = None` |
| `NormalizeDoclingOptions.sourceDocumentId?: string` | `source_document_id: Optional[str] = None` |
| `NormalizeMarkerOptions.page?: number` | `page: Optional[int] = None` |
| `MergeMultiPageTablesOptions.mergeByTitle?: boolean` | `merge_by_title: bool = True` |

### Field Naming Convention

TypeScript uses camelCase; Python uses snake_case. All field names above follow this mapping. Pydantic v2 supports `model_config = ConfigDict(populate_by_name=True)` with `alias_generator=to_camel` to accept camelCase JSON input directly, which is recommended for consuming TPDS JSON output from the TypeScript library.

---

## 2. Package Structure

Proposed layout for the `tpds-python` package, mirroring the TypeScript source tree:

```
tpds-python/
├── tpds/
│   ├── __init__.py          # public barrel (mirrors src/index.ts)
│   ├── schema/
│   │   ├── __init__.py
│   │   └── models.py        # Pydantic BaseModel classes (mirrors src/schema/zod.ts)
│   ├── normalize/
│   │   ├── __init__.py
│   │   ├── normalize_table.py     # normalize_table, NormalizeTableOptions
│   │   ├── infer_headers.py       # infer_headers
│   │   └── merge_multipage.py     # merge_multi_page_tables, MergeMultiPageTablesOptions
│   ├── chunk/
│   │   ├── __init__.py
│   │   ├── build_row_chunks.py    # build_row_chunks
│   │   ├── build_row_group_chunks.py
│   │   ├── build_summary_chunk.py # build_summary_chunk
│   │   ├── build_note_chunks.py   # build_note_chunks
│   │   └── build_table_chunks.py  # build_table_chunks (orchestrator)
│   ├── export/
│   │   ├── __init__.py
│   │   ├── to_html.py        # table_to_html
│   │   ├── to_markdown.py    # table_to_markdown
│   │   └── to_json.py        # table_to_json
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── from_flat_array.py    # normalize_from_flat_array
│   │   ├── from_docling.py       # normalize_from_docling
│   │   └── from_marker.py        # normalize_from_marker
│   └── utils/
│       ├── __init__.py
│       ├── guards.py         # type-narrowing helpers
│       ├── ids.py            # create_id, create_cell_id
│       ├── text.py           # normalize_text
│       └── table.py          # sort_cells, sort_rows, sort_pages
├── tests/
│   └── ...                   # pytest test suite mirroring src/__tests__/
├── pyproject.toml
├── py.typed                  # PEP 561 marker
└── README.md
```

The `tpds/__init__.py` barrel re-exports every public symbol, making `from tpds import DocumentTable, normalize_table` the primary usage pattern.

---

## 3. API Parity Checklist

Every exported function from `src/index.ts` with its proposed Python signature.

| TypeScript export | Python equivalent |
|---|---|
| `normalizeTable(input, options?)` | `def normalize_table(input: Any, options: NormalizeTableOptions \| None = None) -> DocumentTable` |
| `inferHeaders(table)` | `def infer_headers(table: DocumentTable) -> DocumentTable` |
| `mergeMultiPageTables(tables, options?)` | `def merge_multi_page_tables(tables: list[DocumentTable], options: MergeMultiPageTablesOptions \| None = None) -> DocumentTable` |
| `buildTableChunks(table, options?)` | `def build_table_chunks(table: DocumentTable, options: BuildTableChunksOptions \| None = None) -> list[TableChunk]` |
| `buildRowChunks(table, options?)` | `def build_row_chunks(table: DocumentTable, options: BuildRowChunksOptions \| None = None) -> list[TableChunk]` |
| `buildRowGroupChunks(table, rowGroupSize?, includeRepeatedHeaders?)` | `def build_row_group_chunks(table: DocumentTable, row_group_size: int \| None = None, include_repeated_headers: bool = False) -> list[TableChunk]` |
| `buildSummaryChunk(table)` | `def build_summary_chunk(table: DocumentTable) -> TableChunk` |
| `buildNoteChunks(table)` | `def build_note_chunks(table: DocumentTable) -> list[TableChunk]` |
| `tableToHtml(table)` | `def table_to_html(table: DocumentTable) -> str` |
| `tableToMarkdown(table)` | `def table_to_markdown(table: DocumentTable) -> MarkdownExportResult` |
| `tableToJson(table)` | `def table_to_json(table: DocumentTable) -> str` |
| `addFidelityWarnings(table)` | `def add_fidelity_warnings(table: DocumentTable) -> DocumentTable` |
| `validateTable(input)` | `def validate_table(input: Any) -> DocumentTable` |
| `safeValidateTable(input)` | `def safe_validate_table(input: Any) -> DocumentTable \| ValidationError` |
| `normalizeFromFlatArray(rows, options?)` | `def normalize_from_flat_array(rows: list[list[str]], options: FlatArrayAdapterOptions \| None = None) -> DocumentTable` |
| `normalizeFromDocling(input, options?)` | `def normalize_from_docling(input: Any, options: NormalizeDoclingOptions \| None = None) -> DocumentTable` |
| `normalizeFromMarker(input, options?)` | `def normalize_from_marker(input: Any, options: NormalizeMarkerOptions \| None = None) -> DocumentTable` |
| `documentTableJsonSchema` (const) | `DOCUMENT_TABLE_JSON_SCHEMA: dict[str, Any]` (loaded from bundled JSON) |

All Zod schema exports (`documentTableSchema`, `tableCellSchema`, etc.) map to the corresponding Pydantic model class, which is the schema object in Python.

---

## 4. Differences and Open Questions

### Known Differences

**No `undefined` in Python.**
TypeScript distinguishes `null` from `undefined`; optional fields that are absent serialize as nothing. Pydantic v2 fields with `default=None` and `exclude_none=True` on `model_dump()` reproduce this behavior for serialization.

**Immutability.**
TypeScript uses object spread (`{ ...table, fidelityWarnings: [...] }`) for immutable updates. Python Pydantic v2 models are mutable by default. The port should either use `model_config = ConfigDict(frozen=True)` (raises on mutation) and `table.model_copy(update={...})` for safe derivations, or document an explicit copy convention. Frozen models are recommended to mirror the TypeScript invariant.

**No `noUncheckedIndexedAccess` equivalent.**
TypeScript's compiler flag forces explicit `undefined` guards on every array access. Python has no equivalent compile-time enforcement. The port must compensate with defensive runtime checks or `assert` statements at array boundaries, and document this as a known divergence in type safety.

**camelCase vs snake_case JSON round-trip.**
The canonical TPDS JSON uses camelCase keys (matching TypeScript). Python models should accept camelCase via Pydantic `alias_generator` and serialize to camelCase by default for interoperability, while using snake_case as the Python-side attribute name.

**`cellId` format.**
The format `{tableId}:r{rowIndex}c{colIndex}` is identical in both languages. The `create_cell_id` utility must produce the exact same string.

**Row/cell reference model.**
TypeScript rows hold `cellIds: string[]` (references, not inline objects). The Python model retains the same reference-based design. Lookup by `cell_id` requires iterating `table.cells` — a `{cell.cell_id: cell for cell in table.cells}` dict is the Python idiom for fast access.

### Open Questions

**OQ-1 — Row/cell reference vs. direct object references.**
Should the Python port retain the `cell_ids: list[str]` indirection on `TableRow`, or replace it with `cells: list[TableCell]` direct object references? Direct references are more Pythonic and eliminate the lookup step, but break JSON round-trip symmetry with the TypeScript canonical format and make `model_dump()` output incompatible with the JSON Schema. Resolution requires a decision on whether the Python package is a faithful wire-format mirror or a higher-level API.

**OQ-2 — `safe_validate_table` return type.**
TypeScript's `safeValidateTable` returns Zod's `SafeParseResult` (a discriminated union with `.success`, `.data`, `.error`). Python has no standard equivalent. Options: (a) return `DocumentTable` on success and raise `ValidationError` on failure (collapsing to a single function), (b) return a `dataclass SafeParseResult(success: bool, data: DocumentTable | None, error: ValidationError | None)` to mirror the TypeScript shape, or (c) use a `Result` type from a third-party library (e.g., `returns`). The right choice depends on whether the Python API prioritizes idiomaticity or wire-format parity.

---

## 5. Distribution

### PyPI Package Name Candidates

| Candidate | Notes |
|---|---|
| `tpds` | Short, matches the project acronym; risk of squatting on a generic name |
| `tpds-python` | Unambiguous; common pattern for multi-language projects |
| `table-preserving-doc-standard` | Descriptive but verbose; poor tab-completion ergonomics |

Recommendation: **`tpds-python`** for initial release, with a `tpds` import name inside the package (`import tpds`), matching how `beautifulsoup4` publishes as `bs4`.

### Build Tooling

| Tool | Recommendation |
|---|---|
| **uv + hatchling** | Recommended. `uv` is the fastest resolver/installer; `hatchling` is PEP 517-compliant and zero-config for src layouts. Use `pyproject.toml` only, no `setup.py`. |
| Poetry | Acceptable alternative; heavier dependency footprint and slower resolver than uv. |
| setuptools alone | Not recommended; lacks modern build isolation and metadata defaults. |

### Python Version Floor

**Python 3.10** minimum, for:
- `X | Y` union syntax in type hints (`str | None` instead of `Optional[str]`)
- `match` statements (useful in adapter guard logic)
- Pydantic v2 supports 3.8+, but 3.10 union syntax is cleaner in signatures

Recommend testing on 3.10, 3.11, and 3.12 in CI.

### Typing Support

- Include a `py.typed` marker file (PEP 561) at the package root so mypy and pyright pick up inline types automatically.
- No stub files (`.pyi`) needed; Pydantic models and typed function signatures provide full coverage.
- Run `mypy --strict` and `pyright` in CI to catch type regressions.
- Export all public types in `tpds/__init__.py` so `from tpds import DocumentTable` works without importing from sub-modules.
