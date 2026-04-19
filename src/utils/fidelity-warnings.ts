import type { DocumentTable, FidelityWarning } from "../types/table";

const OCR_EDIT_DISTANCE_THRESHOLD = 1;

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

export function addFidelityWarnings(table: DocumentTable): DocumentTable {
  const warnings = new Set<FidelityWarning>();

  const hasMergedCells = table.cells.some(
    (c) => (c.rowSpan !== undefined && c.rowSpan > 1) || (c.colSpan !== undefined && c.colSpan > 1)
  );
  if (hasMergedCells) {
    warnings.add("merged-cells-present");
    warnings.add("markdown-lossy");
  }

  if (table.cells.some((c) => c.inferredHeaders !== undefined && c.inferredHeaders.length > 0)) {
    warnings.add("headers-inferred");
  }

  if (table.rows.some((r) => r.repeatedHeaderRow === true)) {
    warnings.add("repeated-headers-detected");
  }

  if (
    table.cells.some(
      (c) =>
        c.textRaw !== c.textNormalized &&
        levenshtein(c.textRaw, c.textNormalized) > OCR_EDIT_DISTANCE_THRESHOLD
    )
  ) {
    warnings.add("ocr-noise-suspected");
  }

  if (table.continuity?.isMultiPage === true) {
    warnings.add("multi-page-merged");
  }

  return {
    ...table,
    fidelityWarnings: warnings.size > 0 ? [...warnings] : []
  };
}
