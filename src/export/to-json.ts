import type { DocumentTable } from "../types/table";

export const tableToJson = (table: DocumentTable, spacing = 2): string => {
  try {
    return JSON.stringify(table, null, spacing);
  } catch (err) {
    throw new TypeError(
      `tableToJson: table contains non-serializable data (e.g. circular reference in metadata). ${err instanceof Error ? err.message : String(err)}`
    );
  }
};
