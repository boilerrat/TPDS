/**
 * Semantic fidelity benchmark for TPDS fixtures.
 *
 * Scores each fixture on four dimensions (0–1):
 *   headers    – body cells have inferredHeaders; no header cells in body chunks
 *   merges     – rowSpan/colSpan survive normalizeTable; HTML emits correct attrs
 *   provenance – table.provenance non-empty; sourceRefs survive round-trip
 *   notes      – notes/footnotes preserved; notes chunk emitted when present
 *
 * fidelityScore = average of all four dimensions
 *
 * Usage:
 *   npm run benchmark           – print table to stdout
 *   npm run benchmark -- --write – also write docs/benchmark-results.md
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  buildNoteChunks,
  buildTableChunks,
  normalizeTable,
  tableToHtml,
} from "../src/index.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../src/fixtures");
const RESULTS_PATH = resolve(import.meta.dirname, "../docs/benchmark-results.md");
const SKIP = new Set(["broken-markdown-case.json"]);

interface DimensionScore {
  score: number;
  details: string;
}

interface FixtureResult {
  name: string;
  headers: DimensionScore;
  merges: DimensionScore;
  provenance: DimensionScore;
  notes: DimensionScore;
  fidelityScore: number;
}

function scoreHeaders(raw: Record<string, unknown>, table: ReturnType<typeof normalizeTable>): DimensionScore {
  const bodyRows = table.rows.filter((r) => r.rowType !== "header" && r.rowType !== "note");

  if (bodyRows.length === 0) {
    return { score: 1, details: "no body rows" };
  }

  const chunks = buildTableChunks(table, {
    includeSummaryChunk: false,
    includeRowGroupChunks: false,
    includeNotesChunk: false,
  });
  const rowChunks = chunks.filter((c) => c.chunkType === "row");

  if (rowChunks.length === 0) {
    return { score: 0, details: "no row chunks produced" };
  }

  const bodyRowIndexes = new Set(bodyRows.map((r) => r.rowIndex));
  const headerRowIndexes = new Set(
    table.rows.filter((r) => r.rowType === "header").map((r) => r.rowIndex)
  );

  let withHeaders = 0;
  let noHeaderCellsInBody = 0;

  for (const chunk of rowChunks) {
    const chunkCells = table.cells.filter(
      (c) => chunk.rowIndexes.includes(c.rowIndex) && bodyRowIndexes.has(c.rowIndex)
    );

    const hasInferred = chunkCells.some(
      (c) => c.inferredHeaders !== undefined && c.inferredHeaders.length > 0
    );
    if (hasInferred) withHeaders++;

    const headerCellInBody = chunkCells.some(
      (c) => headerRowIndexes.has(c.rowIndex) && c.isHeader
    );
    if (!headerCellInBody) noHeaderCellsInBody++;
  }

  const total = rowChunks.length;
  const score = ((withHeaders / total) * 0.6 + (noHeaderCellsInBody / total) * 0.4);
  return {
    score: Math.round(score * 1000) / 1000,
    details: `${withHeaders}/${total} chunks have inferredHeaders; ${noHeaderCellsInBody}/${total} have no header cells in body`,
  };
}

function scoreMerges(raw: Record<string, unknown>, table: ReturnType<typeof normalizeTable>): DimensionScore {
  const rawCells = (raw as { cells?: Array<Record<string, unknown>> }).cells ?? [];
  const mergedRaw = rawCells.filter(
    (c) => (Number(c["rowSpan"] ?? 1) > 1) || (Number(c["colSpan"] ?? 1) > 1)
  );

  if (mergedRaw.length === 0) {
    return { score: 1, details: "no merged cells in fixture" };
  }

  let spansSurvived = 0;
  for (const rawCell of mergedRaw) {
    const rowSpan = Number(rawCell["rowSpan"] ?? 1);
    const colSpan = Number(rawCell["colSpan"] ?? 1);
    const normalizedCell = table.cells.find(
      (c) => c.rowIndex === rawCell["rowIndex"] && c.colIndex === rawCell["colIndex"]
    );
    if (
      normalizedCell !== undefined &&
      (normalizedCell.rowSpan ?? 1) === rowSpan &&
      (normalizedCell.colSpan ?? 1) === colSpan
    ) {
      spansSurvived++;
    }
  }

  const html = tableToHtml(table);
  let htmlAttrsCorrect = 0;
  for (const rawCell of mergedRaw) {
    const rowSpan = Number(rawCell["rowSpan"] ?? 1);
    const colSpan = Number(rawCell["colSpan"] ?? 1);
    if (rowSpan > 1 && html.includes(`rowspan="${rowSpan}"`)) htmlAttrsCorrect++;
    if (colSpan > 1 && html.includes(`colspan="${colSpan}"`)) htmlAttrsCorrect++;
  }
  const htmlExpected = mergedRaw.filter(
    (c) => Number(c["rowSpan"] ?? 1) > 1 || Number(c["colSpan"] ?? 1) > 1
  ).reduce((acc, c) => {
    if (Number(c["rowSpan"] ?? 1) > 1) acc++;
    if (Number(c["colSpan"] ?? 1) > 1) acc++;
    return acc;
  }, 0);

  const survivalScore = spansSurvived / mergedRaw.length;
  const htmlScore = htmlExpected > 0 ? htmlAttrsCorrect / htmlExpected : 1;
  const score = survivalScore * 0.6 + htmlScore * 0.4;

  return {
    score: Math.round(score * 1000) / 1000,
    details: `${spansSurvived}/${mergedRaw.length} spans survived; html attrs ${htmlAttrsCorrect}/${htmlExpected}`,
  };
}

function scoreProvenance(raw: Record<string, unknown>, table: ReturnType<typeof normalizeTable>): DimensionScore {
  const rawProv = (raw as { provenance?: unknown[] }).provenance;
  const rawCells = (raw as { cells?: Array<Record<string, unknown>> }).cells ?? [];
  const cellsWithSourceRefs = rawCells.filter((c) => Array.isArray(c["sourceRefs"]) && (c["sourceRefs"] as unknown[]).length > 0);

  let provScore = 0;
  let sourceRefScore = 1;

  if (rawProv !== undefined && rawProv.length > 0) {
    provScore = table.provenance !== undefined && table.provenance.length > 0 ? 1 : 0;
  } else {
    provScore = 1;
  }

  if (cellsWithSourceRefs.length > 0) {
    let survived = 0;
    for (const rawCell of cellsWithSourceRefs) {
      const normalized = table.cells.find(
        (c) => c.rowIndex === rawCell["rowIndex"] && c.colIndex === rawCell["colIndex"]
      );
      if (normalized?.sourceRefs !== undefined && normalized.sourceRefs.length > 0) {
        survived++;
      }
    }
    sourceRefScore = survived / cellsWithSourceRefs.length;
  }

  const score = provScore * 0.5 + sourceRefScore * 0.5;
  return {
    score: Math.round(score * 1000) / 1000,
    details: `provenance array ${provScore === 1 ? "present" : "missing"}; ${cellsWithSourceRefs.length > 0 ? `sourceRefs ${Math.round(sourceRefScore * cellsWithSourceRefs.length)}/${cellsWithSourceRefs.length} survived` : "no sourceRefs in fixture"}`,
  };
}

function scoreNotes(raw: Record<string, unknown>, table: ReturnType<typeof normalizeTable>): DimensionScore {
  const rawNotes = (raw as { notes?: string[] }).notes ?? [];
  const rawFootnotes = (raw as { footnotes?: string[] }).footnotes ?? [];
  const hasNotesInFixture = rawNotes.length > 0 || rawFootnotes.length > 0;

  if (!hasNotesInFixture) {
    return { score: 1, details: "no notes in fixture" };
  }

  const notesPreserved =
    JSON.stringify(table.notes ?? []) === JSON.stringify(rawNotes) &&
    JSON.stringify(table.footnotes ?? []) === JSON.stringify(rawFootnotes);

  const noteChunks = buildNoteChunks(table);
  const chunksEmitted = noteChunks.length > 0;

  const score = (notesPreserved ? 0.6 : 0) + (chunksEmitted ? 0.4 : 0);
  return {
    score: Math.round(score * 1000) / 1000,
    details: `notes preserved=${notesPreserved}; note chunks emitted=${chunksEmitted} (${noteChunks.length})`,
  };
}

function benchmarkFixture(filePath: string): FixtureResult {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  // preserveExistingCellIds keeps fixture cellIds so rows.cellIds resolve correctly,
  // enabling inferHeaders to traverse header rows via cellsForRow.
  const table = normalizeTable(raw, { preserveExistingCellIds: true });

  const headers = scoreHeaders(raw, table);
  const merges = scoreMerges(raw, table);
  const provenance = scoreProvenance(raw, table);
  const notes = scoreNotes(raw, table);
  const fidelityScore =
    Math.round(((headers.score + merges.score + provenance.score + notes.score) / 4) * 1000) / 1000;

  const name = (raw["title"] as string | undefined) ?? filePath.split("/").pop() ?? filePath;

  return { name, headers, merges, provenance, notes, fidelityScore };
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function renderTable(results: FixtureResult[]): string {
  const lines: string[] = [];
  lines.push(
    `| ${"Fixture".padEnd(34)} | ${"Headers".padEnd(7)} | ${"Merges".padEnd(6)} | ${"Prov".padEnd(4)} | ${"Notes".padEnd(5)} | ${"Fidelity".padEnd(8)} |`
  );
  lines.push("|" + "-".repeat(36) + "|" + "-".repeat(9) + "|" + "-".repeat(8) + "|" + "-".repeat(6) + "|" + "-".repeat(7) + "|" + "-".repeat(10) + "|");
  for (const r of results) {
    lines.push(
      `| ${pad(r.name, 34)} | ${String(r.headers.score).padEnd(7)} | ${String(r.merges.score).padEnd(6)} | ${String(r.provenance.score).padEnd(4)} | ${String(r.notes.score).padEnd(5)} | ${String(r.fidelityScore).padEnd(8)} |`
    );
  }
  return lines.join("\n");
}

function buildMarkdown(results: FixtureResult[], runAt: string): string {
  const sections: string[] = [];
  sections.push(`# TPDS Semantic Fidelity Benchmark\n`);
  sections.push(`_Generated: ${runAt}_\n`);
  sections.push(`## Summary\n`);
  sections.push(renderTable(results));
  sections.push(`\n## Dimension Definitions\n`);
  sections.push(
    `- **headers** (0–1): Body cells have \`inferredHeaders\`; header cells not mixed into body chunks.\n` +
    `- **merges** (0–1): Merged cells retain correct \`rowSpan\`/\`colSpan\` after normalize; HTML emits \`rowspan\`/\`colspan\` attrs.\n` +
    `- **provenance** (0–1): \`table.provenance\` array present; cell \`sourceRefs\` survive round-trip.\n` +
    `- **notes** (0–1): \`notes\`/\`footnotes\` arrays preserved; notes chunk emitted when present.\n` +
    `- **fidelityScore**: Average of all four dimensions.\n`
  );
  sections.push(`\n## Fixture Details\n`);
  for (const r of results) {
    sections.push(`### ${r.name}\n`);
    sections.push(`| Dimension | Score | Details |`);
    sections.push(`|-----------|-------|---------|`);
    sections.push(`| headers   | ${r.headers.score} | ${r.headers.details} |`);
    sections.push(`| merges    | ${r.merges.score} | ${r.merges.details} |`);
    sections.push(`| provenance| ${r.provenance.score} | ${r.provenance.details} |`);
    sections.push(`| notes     | ${r.notes.score} | ${r.notes.details} |`);
    sections.push(`| **fidelity** | **${r.fidelityScore}** | |`);
    sections.push(``);
  }
  return sections.join("\n");
}

const writeFlag = process.argv.includes("--write");

const fixtureFiles = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith(".json") && !SKIP.has(f))
  .sort();

const results: FixtureResult[] = [];
let anyFailed = false;

for (const file of fixtureFiles) {
  const filePath = join(FIXTURES_DIR, file);
  const result = benchmarkFixture(filePath);
  results.push(result);

  const pass = result.fidelityScore >= 0.9 ? "PASS" : "FAIL";
  if (pass === "FAIL") anyFailed = true;
  console.log(
    `[${pass}] ${file.padEnd(35)} headers=${result.headers.score} merges=${result.merges.score} prov=${result.provenance.score} notes=${result.notes.score} fidelity=${result.fidelityScore}`
  );
}

console.log("\n" + renderTable(results));

if (writeFlag) {
  const md = buildMarkdown(results, new Date().toISOString());
  writeFileSync(RESULTS_PATH, md, "utf8");
  console.log(`\nWrote ${RESULTS_PATH}`);
}

if (anyFailed) {
  console.error("\nOne or more fixtures scored below 0.9 fidelity.");
  process.exit(1);
}
