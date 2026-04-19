#!/usr/bin/env node
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const schemaPath = join(root, "dist/schema.json");
const fixturesDir = join(root, "src/fixtures");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
let passed = 0;
let failed = 0;

for (const file of files) {
  const data = JSON.parse(readFileSync(join(fixturesDir, file), "utf8"));
  const valid = validate(data);
  if (valid) {
    console.log(`  PASS  ${file}`);
    passed++;
  } else {
    console.error(`  FAIL  ${file}`);
    for (const err of validate.errors ?? []) {
      console.error(`        ${err.instancePath} ${err.message}`);
    }
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
