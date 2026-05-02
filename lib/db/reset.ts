import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const DB_PATH =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? path.join(process.cwd(), "data/app.db");

console.log(`[db:reset] Removing ${DB_PATH} and sidecars`);
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  const p = `${DB_PATH}${suffix}`;
  if (existsSync(p)) rmSync(p);
}

console.log("[db:reset] Running pnpm db:migrate");
execSync("pnpm db:migrate", { stdio: "inherit" });

console.log("[db:reset] Running pnpm db:seed");
execSync("pnpm db:seed", { stdio: "inherit" });

console.log("[db:reset] Done.");
