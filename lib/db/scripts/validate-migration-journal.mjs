#!/usr/bin/env node
/**
 * Ensures every migrations/*.sql file is registered in meta/_journal.json.
 * Prevents prod deploy failures when SQL exists but drizzle never runs it.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "migrations");
const journalPath = path.join(migrationsDir, "meta/_journal.json");

const journal = JSON.parse(readFileSync(journalPath, "utf8"));
const tagged = new Set(journal.entries.map((e) => e.tag));
const sqlFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.replace(/\.sql$/, ""));

const missingFromJournal = sqlFiles.filter((tag) => !tagged.has(tag));
const orphanJournal = [...tagged].filter((tag) => !sqlFiles.includes(tag));

if (missingFromJournal.length || orphanJournal.length) {
  if (missingFromJournal.length) {
    console.error("SQL files missing from _journal.json:");
    for (const tag of missingFromJournal) console.error(`  - ${tag}`);
  }
  if (orphanJournal.length) {
    console.error("Journal entries with no SQL file:");
    for (const tag of orphanJournal) console.error(`  - ${tag}`);
  }
  process.exit(1);
}

console.log(`migration journal OK (${sqlFiles.length} files)`);
