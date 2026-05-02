import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { mkdirSync } from "node:fs";

const DB_PATH =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? path.join(process.cwd(), "data/app.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "data/migrations");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

console.log(`[db:migrate] Applying migrations from ${MIGRATIONS_DIR} to ${DB_PATH}`);
migrate(db, { migrationsFolder: MIGRATIONS_DIR });
console.log("[db:migrate] Done.");

sqlite.close();
