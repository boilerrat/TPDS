import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { DocumentTable } from "../types/table";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

export const loadFixture = (name: string): DocumentTable =>
  JSON.parse(readFileSync(path.join(fixturesDir, `${name}.json`), "utf8")) as DocumentTable;
