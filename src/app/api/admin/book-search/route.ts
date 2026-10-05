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
 * Returns candidates from Open Library and the Internet Archive (plus Google
 * Books when a key is set) and marks the ones already in the catalogue, so the
 * UI can show "In library".
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

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const perPage = 24;
  if (query.length < 3) {
    return NextResponse.json({ ok: true, results: [], totalFound: null, hint: null, message: "" });
  }

  const outcome = await searchBooks(query, perPage, page);
  if (outcome.error) {
    return NextResponse.json({ ok: false, message: outcome.error, results: [] });
  }

  const supabase = await createClient();

  // The shop's own shelf, in the same list. For a Bangla catalogue this is the
  // part that matters: the outside services cannot see "গোরা", but we can — and
  // it is the fastest way to notice a title is already in.
  //
  // Two plain queries rather than one OR across the author join: the join filter
  // fails silently, and silence is exactly what we are trying to remove.
  const like = `%${query.replace(/[%,()]/g, "").trim()}%`;
  const [byTitle, byAuthor] = await Promise.all([
    supabase
      .from("books")
      .select("id, slug, title, cover_url, is_active, authors(name)")
      .ilike("title", like)
      .order("title")
      .limit(8),
    supabase
      .from("books")
      .select("id, slug, title, cover_url, is_active, authors!inner(name)")
      .ilike("authors.name", like)
      .order("title")
      .limit(8),
  ]);

  const seen = new Set<string>();
  const mine = [...(byTitle.data ?? []), ...(byAuthor.data ?? [])]
    .filter((row) => {
      if (seen.has(row.id as string)) return false;
      seen.add(row.id as string);
      return true;
    })
    .slice(0, 8)
    .map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      coverUrl: (row.cover_url as string | null) ?? null,
      published: Boolean(row.is_active),
      author: (row.authors as unknown as { name: string } | null)?.name ?? null,
    }));

  const ctx = newImportContext(supabase);

  const results: BookSearchRow[] = [];
  for (const candidate of outcome.results) {
    // Same de-duplication rule the importer uses, so the badge never lies.
    const existing = await findExistingBook(ctx, normalizeIsbn(candidate.isbn), candidate.title);
    results.push({ ...candidate, existing });
  }

  const hasMore =
    typeof outcome.totalFound === "number"
      ? page * perPage < outcome.totalFound
      : outcome.results.length === perPage;

  return NextResponse.json({
    ok: true,
    results,
    mine,
    page,
    hasMore,
    totalFound: outcome.totalFound,
    hint: outcome.hint,
    message: "",
  });
}
