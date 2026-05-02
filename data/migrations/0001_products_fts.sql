-- Hand-authored migration: SQLite FTS5 virtual table over products(name, description)
-- drizzle-kit does not generate FTS5 tables; this file is committed alongside generated migrations.
-- The triggers keep products_fts in sync with the products table on insert/update/delete.

CREATE VIRTUAL TABLE `products_fts` USING fts5(
  name,
  description,
  content=`products`,
  content_rowid=`rowid`,
  tokenize='porter unicode61'
);
--> statement-breakpoint

-- Backfill from existing rows (no-op on a fresh db; safe on a populated one).
INSERT INTO `products_fts` (`rowid`, `name`, `description`)
  SELECT `rowid`, `name`, `description` FROM `products`;
--> statement-breakpoint

CREATE TRIGGER `products_fts_ai` AFTER INSERT ON `products` BEGIN
  INSERT INTO `products_fts` (`rowid`, `name`, `description`)
    VALUES (new.`rowid`, new.`name`, new.`description`);
END;
--> statement-breakpoint

CREATE TRIGGER `products_fts_ad` AFTER DELETE ON `products` BEGIN
  INSERT INTO `products_fts` (`products_fts`, `rowid`, `name`, `description`)
    VALUES ('delete', old.`rowid`, old.`name`, old.`description`);
END;
--> statement-breakpoint

CREATE TRIGGER `products_fts_au` AFTER UPDATE ON `products` BEGIN
  INSERT INTO `products_fts` (`products_fts`, `rowid`, `name`, `description`)
    VALUES ('delete', old.`rowid`, old.`name`, old.`description`);
  INSERT INTO `products_fts` (`rowid`, `name`, `description`)
    VALUES (new.`rowid`, new.`name`, new.`description`);
END;
