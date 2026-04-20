import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateRealWorldEval,
  safeValidateTable,
  validateTable,
  normalizeTable,
  tableToHtml,
  tableToJson,
  tableToMarkdown
} from "./index.js";

const USAGE = `Usage: tpds <command> [options]

Commands:
  validate <file.json>
      Validate a DocumentTable JSON file against the schema.
      Exits 0 if valid, exits 1 with error details if not.

  normalize <file.json> [--output <out.json>]
      Normalize input to canonical JSON. Writes to --output or stdout.

  export <file.json> --format html|markdown|json [--output <file>]
      Export a canonical DocumentTable. Writes to --output or stdout.

  eval <file.json> --output-dir <dir> [--adapter canonical|docling|marker|flat-array]
      Generate a real-world eval bundle with artifacts and a report template.

Options:
  --help    Show this help message
`;

const VALIDATE_USAGE = `Usage: tpds validate <file.json>

Validates a DocumentTable JSON file. Exits 0 if valid, 1 if not.
`;

const NORMALIZE_USAGE = `Usage: tpds normalize <file.json> [--output <out.json>]

Normalizes input to canonical DocumentTable JSON.
`;

const EXPORT_USAGE = `Usage: tpds export <file.json> --format html|markdown|json [--output <file>]

  --format   Required. One of: html, markdown, json
  --output   Optional. Write to this file instead of stdout.
`;

const EVAL_USAGE = `Usage: tpds eval <file.json> --output-dir <dir> [options]

  --output-dir            Required. Directory to write the eval bundle into.
  --adapter               Optional. One of: canonical, docling, marker, flat-array
  --pdf-title             Optional. Source PDF title for the report.
  --source-url            Optional. Source PDF URL for the report.
  --access-date           Optional. Access date to record in the report.
  --evaluator             Optional. Evaluator name for the report.
  --extractor             Optional. Upstream extractor name to record.
  --extractor-command     Optional. Upstream extractor command or revision.
  --table-id              Optional. Override tableId during adapter normalization.
  --title                 Optional. Override normalized table title.
  --caption               Optional. Override normalized table caption.
  --source-document-id    Optional. Override normalized sourceDocumentId.
  --page                  Optional. Page number for marker or flat-array inputs.
  --first-row-is-header   Optional. true/false for flat-array inputs. Defaults to true.
  --row-group-size        Optional. Row-group chunk size. Defaults to 5.
`;

type ParsedArgs = {
  positional: string[];
  flags: Map<string, string | true>;
};

function writeStream(stream: { fd: number }, content: string): void {
  writeFileSync(stream.fd, content, "utf8");
}

function writeStdout(content: string): void {
  writeStream(process.stdout, content);
}

function writeStderr(content: string): void {
  writeStream(process.stderr, content);
}

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  const VALUE_FLAGS = new Set([
    "--output",
    "--format",
    "--output-dir",
    "--adapter",
    "--pdf-title",
    "--source-url",
    "--access-date",
    "--evaluator",
    "--extractor",
    "--extractor-command",
    "--table-id",
    "--title",
    "--caption",
    "--source-document-id",
    "--page",
    "--first-row-is-header",
    "--row-group-size"
  ]);
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === undefined) break;
    if (VALUE_FLAGS.has(arg)) {
      flags.set(arg, args[i + 1] ?? "");
      i += 2;
    } else if (arg.startsWith("-")) {
      flags.set(arg, true);
      i++;
    } else {
      positional.push(arg);
      i++;
    }
  }
  return { positional, flags };
}

function readJson(filePath: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(resolve(filePath), "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error reading file "${filePath}": ${msg}`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error parsing JSON in "${filePath}": ${msg}`);
  }
}

function writeOutput(content: string, outputPath: string | undefined): void {
  if (outputPath) {
    writeFileSync(resolve(outputPath), content, "utf8");
  } else {
    writeStdout(content);
    if (!content.endsWith("\n")) writeStdout("\n");
  }
}

function parseIntegerFlag(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Error: ${name} must be an integer (got "${value}")`);
  }
  return parsed;
}

function parseBooleanFlag(value: string | undefined, name: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (["true", "1", "yes"].includes(value)) return true;
  if (["false", "0", "no"].includes(value)) return false;
  throw new Error(`Error: ${name} must be true or false (got "${value}")`);
}

function main(): number {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    writeStdout(USAGE);
    return 0;
  }

  const command = argv[0];
  const { positional, flags } = parseArgs(argv.slice(1));
  const isHelp = flags.has("--help") || flags.has("-h");

  if (command === "validate") {
    if (isHelp) {
      writeStdout(VALIDATE_USAGE);
      return 0;
    }
    const filePath = positional[0];
    if (!filePath) {
      writeStderr("Error: validate requires a file path\n");
      return 1;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`${msg}\n`);
      return 1;
    }
    const result = safeValidateTable(data);
    if (result.success) {
      writeStdout(`Valid: ${filePath}\n`);
      return 0;
    }
    writeStderr(`Invalid: ${filePath}\n`);
    writeStderr(result.error.toString() + "\n");
    return 1;
  }

  if (command === "normalize") {
    if (isHelp) {
      writeStdout(NORMALIZE_USAGE);
      return 0;
    }
    const filePath = positional[0];
    if (!filePath) {
      writeStderr("Error: normalize requires a file path\n");
      return 1;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`${msg}\n`);
      return 1;
    }
    const outputPath = flags.get("--output") as string | undefined;
    try {
      const table = normalizeTable(data);
      writeOutput(tableToJson(table), outputPath);
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`Normalization failed: ${msg}\n`);
      return 1;
    }
  }

  if (command === "export") {
    if (isHelp) {
      writeStdout(EXPORT_USAGE);
      return 0;
    }
    const filePath = positional[0];
    if (!filePath) {
      writeStderr("Error: export requires a file path\n");
      return 1;
    }
    const format = flags.get("--format") as string | undefined;
    if (!format || !["html", "markdown", "json"].includes(format)) {
      writeStderr(
        `Error: --format must be one of: html, markdown, json${format ? ` (got "${format}")` : ""}\n`
      );
      return 1;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`${msg}\n`);
      return 1;
    }
    let table;
    try {
      table = validateTable(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`Invalid DocumentTable: ${msg}\n`);
      return 1;
    }
    const outputPath = flags.get("--output") as string | undefined;
    let output: string;
    if (format === "html") {
      output = tableToHtml(table);
    } else if (format === "markdown") {
      output = tableToMarkdown(table).markdown;
    } else {
      output = tableToJson(table);
    }
    writeOutput(output, outputPath);
    return 0;
  }

  if (command === "eval") {
    if (isHelp) {
      writeStdout(EVAL_USAGE);
      return 0;
    }
    const filePath = positional[0];
    if (!filePath) {
      writeStderr("Error: eval requires a file path\n");
      return 1;
    }
    const outputDir = flags.get("--output-dir") as string | undefined;
    if (!outputDir) {
      writeStderr("Error: eval requires --output-dir\n");
      return 1;
    }
    const adapter = flags.get("--adapter") as string | undefined;
    if (adapter && !["canonical", "docling", "marker", "flat-array"].includes(adapter)) {
      writeStderr(
        `Error: --adapter must be one of: canonical, docling, marker, flat-array (got "${adapter}")\n`
      );
      return 1;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`${msg}\n`);
      return 1;
    }
    try {
      const result = generateRealWorldEval({
        input: data,
        inputFile: filePath,
        outputDir,
        adapter: adapter as "canonical" | "docling" | "marker" | "flat-array" | undefined,
        pdfTitle: flags.get("--pdf-title") as string | undefined,
        sourceUrl: flags.get("--source-url") as string | undefined,
        accessDate: flags.get("--access-date") as string | undefined,
        evaluator: flags.get("--evaluator") as string | undefined,
        extractor: flags.get("--extractor") as string | undefined,
        extractorCommand: flags.get("--extractor-command") as string | undefined,
        tableId: flags.get("--table-id") as string | undefined,
        title: flags.get("--title") as string | undefined,
        caption: flags.get("--caption") as string | undefined,
        sourceDocumentId: flags.get("--source-document-id") as string | undefined,
        page: parseIntegerFlag(flags.get("--page") as string | undefined, "--page"),
        firstRowIsHeader: parseBooleanFlag(
          flags.get("--first-row-is-header") as string | undefined,
          "--first-row-is-header"
        ),
        rowGroupSize: parseIntegerFlag(
          flags.get("--row-group-size") as string | undefined,
          "--row-group-size"
        )
      });
      writeStdout(`Eval bundle written to ${result.outputDir}\n`);
      writeStdout(`- ${result.normalizedPath}\n`);
      writeStdout(`- ${result.htmlPath}\n`);
      writeStdout(`- ${result.markdownPath}\n`);
      writeStdout(`- ${result.markdownMetaPath}\n`);
      writeStdout(`- ${result.chunksPath}\n`);
      writeStdout(`- ${result.reportPath}\n`);
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeStderr(`Eval failed: ${msg}\n`);
      return 1;
    }
  }

  writeStderr(`Unknown command: "${command}"\n\n`);
  writeStdout(USAGE);
  return 1;
}

process.exitCode = main();
