import type { DocumentTable } from "../types/table";

export const tableToJson = (table: DocumentTable, spacing = 2): string =>
  JSON.stringify(table, null, spacing);
