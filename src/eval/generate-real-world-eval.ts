import { mkdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { normalizeFromDocling } from "../adapters/from-docling";
import { normalizeFromFlatArray } from "../adapters/from-flat-array";
import { normalizeFromMarker } from "../adapters/from-marker";
import { buildTableChunks } from "../chunk/build-table-chunks";
import { tableToHtml } from "../export/to-html";
import { tableToJson } from "../export/to-json";
import { tableToMarkdown } from "../export/to-markdown";
import { documentTableSchema } from "../schema/zod";
import type { TableChunk, TableChunkType } from "../types/chunk";
import type { DocumentTable } from "../types/table";

export type EvalAdapter = "canonical" | "docling" | "marker" | "flat-array";

export type GenerateRealWorldEvalOptions = {
  input: unknown;
  inputFile?: string;
  outputDir: string;
  adapter?: EvalAdapter;
  pdfTitle?: string;
  sourceUrl?: string;
  accessDate?: string;
  evaluator?: string;
  extractor?: string;
  extractorCommand?: string;
  tableId?: string;
  title?: string;
  caption?: string;
  sourceDocumentId?: string;
  page?: number;
  firstRowIsHeader?: boolean;
  rowGroupSize?: number;
};

export type GenerateRealWorldEvalResult = {
  outputDir: string;
  normalizedPath: string;
  htmlPath: string;
  markdownPath: string;
  markdownMetaPath: string;
  chunksPath: string;
  reportPath: string;
  table: DocumentTable;
  chunks: TableChunk[];
};

const today = (): string => new Date().toISOString().slice(0, 10);

const writeTextFile = (filePath: string, content: string): void => {
  writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
};

const toJsonFile = (filePath: string, value: unknown): void => {
  writeTextFile(filePath, JSON.stringify(value, null, 2));
};

const countChunks = (chunks: TableChunk[], type: TableChunkType): number =>
  chunks.filter((chunk) => chunk.chunkType === type).length;

const renderReport = (
  table: DocumentTable,
  chunks: TableChunk[],
  options: GenerateRealWorldEvalOptions
): string => {
  const markdownResult = tableToMarkdown(table);
  const displayTitle =
    options.pdfTitle ?? table.title ?? table.caption ?? table.sourceFileName ?? table.tableId;
  const inputLabel = options.inputFile ? basename(options.inputFile) : "(not recorded)";
  const pages = table.pages.join(", ");
  const fidelityWarnings =
    table.fidelityWarnings && table.fidelityWarnings.length > 0
      ? table.fidelityWarnings.map((warning) => `\`${warning}\``).join(", ")
      : "none";
  const markdownWarnings =
    markdownResult.warnings.length > 0
      ? markdownResult.warnings.map((warning) => `\`${warning}\``).join(", ")
      : "none";

  return `# TPDS Real-World Eval — ${displayTitle}

## Run metadata

- Source PDF title: ${options.pdfTitle ?? "(fill in if different from normalized title)"}
- Source URL: ${options.sourceUrl ?? "(fill in)"}
- Access date: ${options.accessDate ?? today()}
- Evaluator: ${options.evaluator ?? "(fill in)"}
- Input file: ${inputLabel}
- TPDS adapter: \`${options.adapter ?? "canonical"}\`
- Upstream extractor: ${options.extractor ?? "(fill in)"}
- Extractor command or revision: ${options.extractorCommand ?? "(fill in)"}

## Generated artifacts

- \`normalized.json\` — canonical TPDS JSON
- \`export.html\` — HTML review export
- \`export.md\` — Markdown export
- \`export.markdown.json\` — Markdown fidelity + warnings
- \`chunks.json\` — full chunk output

## Auto-observed signals

- Table ID: \`${table.tableId}\`
- Pages: ${pages || "none"}
- Row count: ${table.rows.length}
- Column count: ${table.columns.length}
- Header groups: ${table.headerGroups?.length ?? 0}
- Notes count: ${table.notes?.length ?? 0}
- Footnotes count: ${table.footnotes?.length ?? 0}
- Table fidelity warnings: ${fidelityWarnings}
- Markdown fidelity: \`${markdownResult.fidelity}\`
- Markdown warnings: ${markdownWarnings}
- Chunk counts: summary=${countChunks(chunks, "summary")}, row=${countChunks(chunks, "row")}, row-group=${countChunks(chunks, "row-group")}, notes=${countChunks(chunks, "notes")}

## Rubric

Use only \`pass\`, \`follow-up\`, or \`fail\` in the Outcome column.

| Dimension | Outcome | Notes |
|---|---|---|
| Table detection coverage | \`pass|follow-up|fail\` | |
| Row/column structure preservation | \`pass|follow-up|fail\` | |
| Repeated-header handling | \`pass|follow-up|fail\` | |
| Multi-page merge correctness | \`pass|follow-up|fail\` | |
| Merged-cell preservation | \`pass|follow-up|fail\` | |
| Nested-header fidelity | \`pass|follow-up|fail\` | |
| Notes and footnotes retention | \`pass|follow-up|fail\` | |
| HTML export usefulness | \`pass|follow-up|fail\` | |
| Markdown fallback quality | \`pass|follow-up|fail\` | |
| Chunk usefulness | \`pass|follow-up|fail\` | |
| Manual cleanup burden | \`pass|follow-up|fail\` | |

## Overall call

- Outcome: \`pass|follow-up|fail\`
- Summary:
- Issues opened:
`;
};

const normalizeInput = (input: unknown, options: GenerateRealWorldEvalOptions): DocumentTable => {
  const adapter = options.adapter ?? "canonical";

  if (adapter === "canonical") {
    return documentTableSchema.parse(input);
  }

  if (adapter === "docling") {
    return normalizeFromDocling(input, {
      tableId: options.tableId,
      title: options.title,
      caption: options.caption,
      sourceDocumentId: options.sourceDocumentId
    });
  }

  if (adapter === "marker") {
    return normalizeFromMarker(input, {
      tableId: options.tableId,
      title: options.title,
      caption: options.caption,
      sourceDocumentId: options.sourceDocumentId,
      page: options.page
    });
  }

  if (!Array.isArray(input)) {
    throw new Error('generateRealWorldEval: adapter "flat-array" requires a JSON array of row arrays');
  }
  if (input.some((row) => !Array.isArray(row))) {
    throw new Error(
      'generateRealWorldEval: adapter "flat-array" requires every top-level item to be a row array'
    );
  }

  return normalizeFromFlatArray(input as string[][], {
    firstRowIsHeader: options.firstRowIsHeader ?? true,
    tableId: options.tableId,
    title: options.title,
    pages: options.page !== undefined ? [options.page] : undefined,
    standardVersion: undefined
  });
};

export const generateRealWorldEval = (
  options: GenerateRealWorldEvalOptions
): GenerateRealWorldEvalResult => {
  const outputDir = resolve(options.outputDir);
  mkdirSync(outputDir, { recursive: true });

  const table = normalizeInput(options.input, options);
  const markdownResult = tableToMarkdown(table);
  const chunks = buildTableChunks(table, { rowGroupSize: options.rowGroupSize ?? 5 });

  const normalizedPath = resolve(outputDir, "normalized.json");
  const htmlPath = resolve(outputDir, "export.html");
  const markdownPath = resolve(outputDir, "export.md");
  const markdownMetaPath = resolve(outputDir, "export.markdown.json");
  const chunksPath = resolve(outputDir, "chunks.json");
  const reportPath = resolve(outputDir, "report.md");

  writeTextFile(normalizedPath, tableToJson(table));
  writeTextFile(htmlPath, tableToHtml(table));
  writeTextFile(markdownPath, markdownResult.markdown);
  toJsonFile(markdownMetaPath, markdownResult);
  toJsonFile(chunksPath, chunks);
  writeTextFile(reportPath, renderReport(table, chunks, options));

  return {
    outputDir,
    normalizedPath,
    htmlPath,
    markdownPath,
    markdownMetaPath,
    chunksPath,
    reportPath,
    table,
    chunks
  };
};
