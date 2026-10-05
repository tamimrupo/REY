#!/usr/bin/env node
/**
 * Direct SQL runner — the one place `DATABASE_URL` is actually used.
 *
 * The web app never opens a Postgres connection (it talks through the Supabase
 * API); this script is for admin work that is easier in raw SQL: one-off
 * fixes, imports, reports, backups.
 *
 * Usage (Node loads .env.local itself, see the `db` script in package.json):
 *   npm run db -- "select count(*) from books"
 *   npm run db -- path/to/query.sql
 *
 * Get DATABASE_URL from Supabase → Connect. For scripts, copy the
 * "Transaction pooler" (port 6543) string so connections do not pile up.
 */
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Paste it into .env.local (see .env.example) — " +
      "Supabase dashboard → Connect → Transaction pooler.",
  );
  process.exit(1);
}

const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  console.error('Usage: npm run db -- "select 1"   or   npm run db -- query.sql');
  process.exit(1);
}

const sql =
  input.toLowerCase().endsWith(".sql") && existsSync(input)
    ? readFileSync(input, "utf8")
    : input;

const client = new pg.Client({
  connectionString,
  // Supabase's pooler certificate chain is not always in Node's default store.
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(sql);

  // A multi-statement query returns an array; show each result.
  for (const r of Array.isArray(result) ? result : [result]) {
    if (r.rows?.length) console.table(r.rows);
    else console.log(`${r.command ?? "OK"}${r.rowCount == null ? "" : ` — ${r.rowCount} row(s)`}`);
  }
} catch (error) {
  console.error(`SQL failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
