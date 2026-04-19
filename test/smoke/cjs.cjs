"use strict";

const { normalizeTable, safeValidateTable, buildTableChunks } = require("../../dist/index.cjs");

const raw = {
  tableId: "smoke-t2",
  title: "Smoke CJS",
  pages: [1],
  rows: [
    { rowIndex: 0, rowType: "header", cellIds: ["smoke-t2:0:0"] },
    { rowIndex: 1, rowType: "body", cellIds: ["smoke-t2:1:0"] },
  ],
  columns: [{ colIndex: 0, header: "Col" }],
  cells: [
    { cellId: "smoke-t2:0:0", rowIndex: 0, colIndex: 0, textRaw: "Col", textNormalized: "Col", isHeader: true },
    { cellId: "smoke-t2:1:0", rowIndex: 1, colIndex: 0, textRaw: "Val", textNormalized: "Val", isHeader: false },
  ],
};

const table = normalizeTable(raw);
const valid = safeValidateTable(table);
if (!valid.success) throw new Error("safeValidateTable failed: " + JSON.stringify(valid.error));

const chunks = buildTableChunks(table);
if (!Array.isArray(chunks) || chunks.length === 0) throw new Error("buildTableChunks returned empty");

console.log("CJS smoke OK — chunks:", chunks.length);
