import { normalizeTable, safeValidateTable, buildTableChunks } from "../../dist/index.js";

const raw = {
  tableId: "smoke-t1",
  title: "Smoke ESM",
  pages: [1],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["smoke-t1:0:0"] },
    { rowIndex: 1, rowType: "body", cellIds: ["smoke-t1:1:0"] },
  ],
  columns: [{ colIndex: 0, header: "Col" }],
  cells: [
    { cellId: "smoke-t1:0:0", rowIndex: 0, colIndex: 0, textRaw: "Col", textNormalized: "Col", isHeader: true },
    { cellId: "smoke-t1:1:0", rowIndex: 1, colIndex: 0, textRaw: "Val", textNormalized: "Val", isHeader: false },
  ],
};

const table = normalizeTable(raw);
const valid = safeValidateTable(table);
if (!valid.success) throw new Error("safeValidateTable failed: " + JSON.stringify(valid.error));

const chunks = buildTableChunks(table);
if (!Array.isArray(chunks) || chunks.length === 0) throw new Error("buildTableChunks returned empty");

console.log("ESM smoke OK — chunks:", chunks.length);
