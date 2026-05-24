import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["pino", "pino-http", "thread-stream"],
  sourcemap: true,
  tsconfig: "tsconfig.json",
  logLevel: "info",
});
