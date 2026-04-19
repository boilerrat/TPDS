import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  safeValidateTable,
  validateTable,
  normalizeTable,
  tableToHtml,
  tableToJson,
  tableToMarkdown,
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

type ParsedArgs = {
  positional: string[];
  flags: Map<string, string | true>;
};

function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  const VALUE_FLAGS = new Set(["--output", "--format"]);
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
    process.stderr.write(`Error reading file "${filePath}": ${msg}\n`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error parsing JSON in "${filePath}": ${msg}\n`);
    process.exit(1);
  }
}

function writeOutput(content: string, outputPath: string | undefined): void {
  if (outputPath) {
    writeFileSync(resolve(outputPath), content, "utf8");
  } else {
    process.stdout.write(content);
    if (!content.endsWith("\n")) process.stdout.write("\n");
  }
}

const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
  process.stdout.write(USAGE);
  process.exit(0);
}

const command = argv[0];
const { positional, flags } = parseArgs(argv.slice(1));
const isHelp = flags.has("--help") || flags.has("-h");

if (command === "validate") {
  if (isHelp) {
    process.stdout.write(VALIDATE_USAGE);
    process.exit(0);
  }
  const filePath = positional[0];
  if (!filePath) {
    process.stderr.write("Error: validate requires a file path\n");
    process.exit(1);
  }
  const data = readJson(filePath);
  const result = safeValidateTable(data);
  if (result.success) {
    process.stdout.write(`Valid: ${filePath}\n`);
    process.exit(0);
  } else {
    process.stderr.write(`Invalid: ${filePath}\n`);
    process.stderr.write(result.error.toString() + "\n");
    process.exit(1);
  }
} else if (command === "normalize") {
  if (isHelp) {
    process.stdout.write(NORMALIZE_USAGE);
    process.exit(0);
  }
  const filePath = positional[0];
  if (!filePath) {
    process.stderr.write("Error: normalize requires a file path\n");
    process.exit(1);
  }
  const data = readJson(filePath);
  const outputPath = flags.get("--output") as string | undefined;
  try {
    const table = normalizeTable(data);
    writeOutput(tableToJson(table), outputPath);
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Normalization failed: ${msg}\n`);
    process.exit(1);
  }
} else if (command === "export") {
  if (isHelp) {
    process.stdout.write(EXPORT_USAGE);
    process.exit(0);
  }
  const filePath = positional[0];
  if (!filePath) {
    process.stderr.write("Error: export requires a file path\n");
    process.exit(1);
  }
  const format = flags.get("--format") as string | undefined;
  if (!format || !["html", "markdown", "json"].includes(format)) {
    process.stderr.write(
      `Error: --format must be one of: html, markdown, json${format ? ` (got "${format}")` : ""}\n`
    );
    process.exit(1);
  }
  const data = readJson(filePath);
  let table;
  try {
    table = validateTable(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Invalid DocumentTable: ${msg}\n`);
    process.exit(1);
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
  process.exit(0);
} else {
  process.stderr.write(`Unknown command: "${command}"\n\n`);
  process.stdout.write(USAGE);
  process.exit(1);
}
