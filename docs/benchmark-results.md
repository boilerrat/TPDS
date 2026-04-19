# TPDS Semantic Fidelity Benchmark

_Generated: 2026-04-19T17:39:54.789Z_

## Summary

| Fixture                            | Headers | Merges | Prov | Notes | Fidelity |
|------------------------------------|---------|--------|------|-------|----------|
| Consolidated Income Statement      | 1       | 1      | 1    | 1     | 1        |
| Study Results Summary              | 1       | 1      | 1    | 1     | 1        |
| Employee Counts by Department      | 1       | 1      | 1    | 1     | 1        |
| Shipment Delays by Port            | 1       | 1      | 1    | 1     | 1        |
| Customer Satisfaction Survey Resul | 1       | 1      | 1    | 1     | 1        |
| Annual Production Figures          | 1       | 1      | 1    | 1     | 1        |
| Inventory Levels by SKU            | 1       | 1      | 1    | 1     | 1        |
| Revenue by Quarter                 | 1       | 1      | 1    | 1     | 1        |
| Boilermaker Wage Schedule — 2024   | 1       | 1      | 1    | 1     | 1        |
| Multi-Trade Wage Schedule — Effect | 1       | 1      | 1    | 1     | 1        |
| System Performance Benchmark Matri | 1       | 1      | 1    | 1     | 1        |

## Dimension Definitions

- **headers** (0–1): Body cells have `inferredHeaders`; header cells not mixed into body chunks.
- **merges** (0–1): Merged cells retain correct `rowSpan`/`colSpan` after normalize; HTML emits `rowspan`/`colspan` attrs.
- **provenance** (0–1): `table.provenance` array present; cell `sourceRefs` survive round-trip.
- **notes** (0–1): `notes`/`footnotes` arrays preserved; notes chunk emitted when present.
- **fidelityScore**: Average of all four dimensions.


## Fixture Details

### Consolidated Income Statement

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 6/6 chunks have inferredHeaders; 6/6 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Study Results Summary

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 4/4 chunks have inferredHeaders; 4/4 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Employee Counts by Department

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 1/1 chunks have inferredHeaders; 1/1 have no header cells in body |
| merges    | 1 | 2/2 spans survived; html attrs 2/2 |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | no notes in fixture |
| **fidelity** | **1** | |

### Shipment Delays by Port

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 2/2 chunks have inferredHeaders; 2/2 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Customer Satisfaction Survey Results

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 4/4 chunks have inferredHeaders; 4/4 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Annual Production Figures

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 4/4 chunks have inferredHeaders; 4/4 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Inventory Levels by SKU

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 5/5 chunks have inferredHeaders; 5/5 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Revenue by Quarter

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 2/2 chunks have inferredHeaders; 2/2 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; sourceRefs 1/1 survived |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Boilermaker Wage Schedule — 2024

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 5/5 chunks have inferredHeaders; 5/5 have no header cells in body |
| merges    | 1 | 4/4 spans survived; html attrs 4/4 |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### Multi-Trade Wage Schedule — Effective Dates 2024–2026

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 12/12 chunks have inferredHeaders; 12/12 have no header cells in body |
| merges    | 1 | 3/3 spans survived; html attrs 3/3 |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |

### System Performance Benchmark Matrix

| Dimension | Score | Details |
|-----------|-------|---------|
| headers   | 1 | 3/3 chunks have inferredHeaders; 3/3 have no header cells in body |
| merges    | 1 | no merged cells in fixture |
| provenance| 1 | provenance array present; no sourceRefs in fixture |
| notes     | 1 | notes preserved=true; note chunks emitted=true (1) |
| **fidelity** | **1** | |
