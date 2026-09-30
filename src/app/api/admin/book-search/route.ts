import { NextResponse } from "next/server";

import { isAdmin, getSession } from "@/lib/auth";
import { searchBooks, type BookSearchRow } from "@/lib/book-search";
import { supabaseConfigured } from "@/lib/env";
import { normalizeIsbn } from "@/lib/import";
import { findExistingBook, newImportContext } from "@/lib/import-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Live metadata search for the admin import screen.
 *
 * Returns candidates from Open Library (plus Google Books when a key is set) and
 * marks the ones already in the catalogue, so the UI can show "In library".
 * Admin-only: this is the one route that reaches the public internet on demand.
 */

export async function GET(request: Request) {
  if (!supabaseConfigured) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not connected yet.", results: [] },
      { status: 503 },
    );
  }

  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { ok: false, message: "Admins only.", results: [] },
      { status: 403 },
    );
  }

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (query.length < 3) {
    return NextResponse.json({ ok: true, results: [], totalFound: null, hint: null, message: "" });
  }

  const outcome = await searchBooks(query, 12);
  if (outcome.error) {
    return NextResponse.json({ ok: false, message: outcome.error, results: [] });
  }

  const supabase = await createClient();
  const ctx = newImportContext(supabase);

  const results: BookSearchRow[] = [];
  for (const candidate of outcome.results) {
    // Same de-duplication rule the importer uses, so the badge never lies.
    const existing = await findExistingBook(ctx, normalizeIsbn(candidate.isbn), candidate.title);
    results.push({ ...candidate, existing });
  }

  return NextResponse.json({
    ok: true,
    results,
    totalFound: outcome.totalFound,
    hint: outcome.hint,
    message: "",
  });
}
