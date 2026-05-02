// server-only — do not import from client components
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? path.join(process.cwd(), "data/app.db");

const globalForDb = globalThis as unknown as {
  __sqlite?: Database.Database;
  __db?: ReturnType<typeof drizzle<typeof schema>>;
};

function createConnection() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

const sqlite = globalForDb.__sqlite ?? createConnection();
export const db = globalForDb.__db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sqlite = sqlite;
  globalForDb.__db = db;
}

export * from "./schema";
