import { copyFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node18",
    onSuccess: async () => {
      copyFileSync("src/schema/json-schema.json", "dist/schema.json");
      console.log("Copied src/schema/json-schema.json → dist/schema.json");
    },
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: false,
    target: "node18",
    banner: { js: "#!/usr/bin/env node" },
  },
]);
