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

  writeStderr(`Unknown command: "${command}"\n\n`);
  writeStdout(USAGE);
  return 1;
}

process.exitCode = main();
