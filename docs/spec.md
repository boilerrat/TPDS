# TPDS Spec

TPDS defines a canonical `DocumentTable` object for preserving table semantics between extraction and retrieval.

Core rules:

- JSON is canonical.
- Markdown is derived.
- Cells preserve `rowSpan` and `colSpan`.
- Provenance stays attached at table and cell level.
- Multi-page continuity stays inside one logical table when continuity is clear.
- Repeated continuation headers are marked, not converted into new body data.
