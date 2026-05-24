import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: [
    "bcryptjs",
    "cookie-parser",
    "cors",
    "drizzle-orm",
    "drizzle-orm/*",
    "drizzle-zod",
    "express",
    "express/*",
    "jsonwebtoken",
    "pg",
    "pino",
    "pino-http",
    "zod",
  ],
  sourcemap: true,
  tsconfig: "tsconfig.json",
  logLevel: "info",
});
