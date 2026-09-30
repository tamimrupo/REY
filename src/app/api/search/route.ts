import { NextResponse } from "next/server";

import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Live search for the header overlay.
 *
 * Public by design — it only ever reads active catalogue rows, which is exactly
 * what the library page already shows a signed-out visitor. Matching on author
 * name as well as title makes "orwell" and "hима" work the way people expect.
 */

const BOOK_FIELDS =
  "id, title, slug, cover_url, description, language, pages, published_year, rarity, authors(name, slug), genres(name, slug)";

/**
 * Same fields, but with an inner join on the author.
 *
 * A plain filter on an embedded resource only filters the *embed*: asking for
 * "orwell" that way returns the entire catalogue with the author blanked out.
 * `!inner` turns it into a join that actually drops non-matching books.
 */
const BOOK_FIELDS_BY_AUTHOR =
  "id, title, slug, cover_url, description, language, pages, published_year, rarity, authors!inner(name, slug), genres(name, slug)";

type BookRow = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  description: string | null;
  language: string | null;
  pages: number | null;
  published_year: number | null;
  rarity: string;
  authors: { name: string; slug: string | null } | null;
  genres: { name: string; slug: string } | null;
};

type GenreRow = { name: string; slug: string; books?: { count: number }[] };

function genreWithCount(row: GenreRow) {
  const count = Array.isArray(row.books) ? (row.books[0]?.count ?? 0) : 0;
  return { name: row.name, slug: row.slug, books: count };
}

export async function GET(request: Request) {
  if (!supabaseConfigured) {
    return NextResponse.json(
      { ok: false, books: [], genres: [], totalBooks: 0, query: "" },
      { status: 503 },
    );
  }

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  const supabase = await createClient();

  // Nothing typed yet: offer the shelves worth browsing instead of a blank panel.
  if (query.length < 2) {
    const { data } = await supabase
      .from("genres")
      .select("name, slug, books(count)")
      .order("sort_order")
      .limit(24);

    const genres = ((data ?? []) as GenreRow[])
      .map(genreWithCount)
      .filter((genre) => genre.books > 0)
      .sort((a, b) => b.books - a.books)
      .slice(0, 8);

    return NextResponse.json({ ok: true, books: [], genres, totalBooks: 0, query: "" });
  }

  const like = `%${query}%`;

  const [byTitle, byAuthor, matchingGenres, titleIds, authorIds] = await Promise.all([
    supabase
      .from("books")
      .select(BOOK_FIELDS)
      .eq("is_active", true)
      .ilike("title", like)
      .order("title")
      .limit(8),
    supabase
      .from("books")
      .select(BOOK_FIELDS_BY_AUTHOR)
      .eq("is_active", true)
      .ilike("authors.name", like)
      .order("title")
      .limit(8),
    supabase.from("genres").select("name, slug, books(count)").ilike("name", like).limit(6),
    // For an honest "see all" number, count the union of both matches.
    supabase.from("books").select("id").eq("is_active", true).ilike("title", like).limit(300),
    supabase
      .from("books")
      .select("id, authors!inner(name)")
      .eq("is_active", true)
      .ilike("authors.name", like)
      .limit(300),
  ]);

  const seen = new Set<string>();
  const books: BookRow[] = [];
  const rows = [...(byTitle.data ?? []), ...(byAuthor.data ?? [])] as unknown as BookRow[];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    books.push(row);
    if (books.length >= 8) break;
  }

  const ids = new Set<string>();
  for (const row of [...(titleIds.data ?? []), ...(authorIds.data ?? [])]) {
    ids.add(String((row as { id: string }).id));
  }

  const genres = ((matchingGenres.data ?? []) as GenreRow[])
    .map(genreWithCount)
    .filter((genre) => genre.books > 0);

  return NextResponse.json({
    ok: true,
    query,
    books,
    genres,
    totalBooks: ids.size,
  });
}
