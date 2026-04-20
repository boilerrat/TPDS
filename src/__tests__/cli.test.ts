import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliBin = path.join(rootDir, "dist", "cli.js");
const fixturesDir = path.join(rootDir, "src", "fixtures");
const simpleFixture = path.join(fixturesDir, "simple-table.json");
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

const invalidJsonPath = path.join(tmpdir(), "tpds-test-invalid.json");
const invalidTablePath = path.join(tmpdir(), "tpds-test-invalid-table.json");
const evalOutDir = path.join(tmpdir(), "tpds-eval-out");

const run = (...args: string[]) =>
  spawnSync(process.execPath, [cliBin, ...args], { encoding: "utf8", stdio: "pipe" });

beforeAll(() => {
  writeFileSync(invalidJsonPath, "not valid json", "utf8");
  writeFileSync(invalidTablePath, JSON.stringify({ foo: "bar" }), "utf8");
  const build = spawnSync(npmBin, ["run", "build"], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (build.status !== 0) {
    throw new Error(
      `Failed to build CLI test fixture.\nstdout:\n${build.stdout}\nstderr:\n${build.stderr}`
    );
  }
});

afterAll(() => {
  if (existsSync(invalidJsonPath)) unlinkSync(invalidJsonPath);
  if (existsSync(invalidTablePath)) unlinkSync(invalidTablePath);
  if (existsSync(evalOutDir)) rmSync(evalOutDir, { recursive: true, force: true });
});

describe("tpds CLI binary", () => {
  it("dist/cli.js exists after build", () => {
    expect(existsSync(cliBin)).toBe(true);
  });

  describe("--help", () => {
    it("exits 0 and lists all commands", () => {
      const result = run("--help");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("validate");
      expect(result.stdout).toContain("normalize");
      expect(result.stdout).toContain("export");
    });
  });

  describe("spawned callers", () => {
    it("receives stdout when the CLI is invoked through a pipe", () => {
      const result = run("--help");
      expect(result.stdout).toContain("Usage: tpds");
      expect(result.stdout).toContain("export");
    });

    it("receives stderr when the CLI exits with an error", () => {
      const result = run("validate", invalidTablePath);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Invalid: ${invalidTablePath}`);
    });
  });

  describe("validate", () => {
    it("exits 0 for a valid fixture", () => {
      const result = run("validate", simpleFixture);
      expect(result.status).toBe(0);
    });

    it("exits 1 and prints error for invalid JSON file", () => {
      const result = run("validate", invalidJsonPath);
      expect(result.status).toBe(1);
    });

    it("exits 1 and prints error for JSON that fails schema", () => {
      const result = run("validate", invalidTablePath);
      expect(result.status).toBe(1);
      expect(result.stderr).toBeTruthy();
    });

    it("exits 1 when file does not exist", () => {
      const result = run("validate", "/tmp/tpds-no-such-file.json");
      expect(result.status).toBe(1);
    });

    it("shows validate help with --help", () => {
      const result = run("validate", "--help");
      expect(result.status).toBe(0);
    });
  });

  describe("normalize", () => {
    it("outputs valid canonical JSON to stdout", () => {
      const result = run("normalize", simpleFixture);
      expect(result.status).toBe(0);
      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty("tableId");
      expect(parsed).toHaveProperty("cells");
      expect(parsed).toHaveProperty("rows");
    });

    it("writes JSON to --output file", () => {
      const outPath = path.join(tmpdir(), "tpds-normalize-out.json");
      try {
        const result = run("normalize", simpleFixture, "--output", outPath);
        expect(result.status).toBe(0);
        expect(existsSync(outPath)).toBe(true);
        const parsed: unknown = JSON.parse(readFileSync(outPath, "utf8"));
        expect(parsed).toHaveProperty("tableId");
      } finally {
        if (existsSync(outPath)) unlinkSync(outPath);
      }
    });

    it("exits 1 when file does not exist", () => {
      const result = run("normalize", "/tmp/tpds-no-such-file.json");
      expect(result.status).toBe(1);
    });
  });

  describe("export", () => {
    it("outputs HTML for --format html", () => {
      const result = run("export", simpleFixture, "--format", "html");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("<table>");
      expect(result.stdout).toContain("</table>");
    });

    it("outputs markdown for --format markdown", () => {
      const result = run("export", simpleFixture, "--format", "markdown");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("|");
    });

    it("outputs JSON string for --format json", () => {
      const result = run("export", simpleFixture, "--format", "json");
      expect(result.status).toBe(0);
      const parsed: unknown = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty("tableId");
    });

    it("writes HTML to --output file", () => {
      const outPath = path.join(tmpdir(), "tpds-export-out.html");
      try {
        const result = run("export", simpleFixture, "--format", "html", "--output", outPath);
        expect(result.status).toBe(0);
        expect(existsSync(outPath)).toBe(true);
      } finally {
        if (existsSync(outPath)) unlinkSync(outPath);
      }
    });

    it("exits 1 when --format is missing", () => {
      const result = run("export", simpleFixture);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("--format");
    });

    it("exits 1 for unknown --format value", () => {
      const result = run("export", simpleFixture, "--format", "pdf");
      expect(result.status).toBe(1);
    });

    it("exits 1 when file does not exist", () => {
      const result = run("export", "/tmp/tpds-no-such-file.json", "--format", "html");
      expect(result.status).toBe(1);
    });
  });

  describe("eval", () => {
    it("writes a real-world eval bundle for a canonical fixture", () => {
      const result = run(
        "eval",
        simpleFixture,
        "--output-dir",
        evalOutDir,
        "--pdf-title",
        "Simple Fixture PDF",
        "--source-url",
        "https://example.com/simple.pdf",
        "--evaluator",
        "Test Runner"
      );
      expect(result.status).toBe(0);
      expect(existsSync(path.join(evalOutDir, "normalized.json"))).toBe(true);
      expect(existsSync(path.join(evalOutDir, "export.html"))).toBe(true);
      expect(existsSync(path.join(evalOutDir, "export.md"))).toBe(true);
      expect(existsSync(path.join(evalOutDir, "export.markdown.json"))).toBe(true);
      expect(existsSync(path.join(evalOutDir, "chunks.json"))).toBe(true);
      expect(existsSync(path.join(evalOutDir, "report.md"))).toBe(true);

      const markdownMeta = JSON.parse(
        readFileSync(path.join(evalOutDir, "export.markdown.json"), "utf8")
      ) as { fidelity: string; warnings: string[] };
      expect(markdownMeta.fidelity).toBe("lossless");
      expect(markdownMeta.warnings).toEqual([]);

      const report = readFileSync(path.join(evalOutDir, "report.md"), "utf8");
      expect(report).toContain("Simple Fixture PDF");
      expect(report).toContain("Table detection coverage");
      expect(report).toContain("Chunk counts:");
    });

    it("exits 1 when --output-dir is missing", () => {
      const result = run("eval", simpleFixture);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("--output-dir");
    });
  });

  describe("unknown command", () => {
    it("exits 1 for an unknown command", () => {
      const result = run("foobar");
      expect(result.status).toBe(1);
    });
  });
});
