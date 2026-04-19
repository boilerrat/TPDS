#!/usr/bin/env node
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { z } = await import("zod");
const { documentTableSchema } = await import("../dist/index.js");

const schema = z.toJSONSchema(documentTableSchema, {
  target: "draft-7",
  $schema: true
});

const outPath = join(__dirname, "../src/schema/json-schema.json");
writeFileSync(outPath, JSON.stringify(schema, null, 2) + "\n");
console.log("Generated src/schema/json-schema.json");
