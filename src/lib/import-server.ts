/**
 * Server-side import plumbing shared by every import path (CSV, Open Library
 * bulk, and the search-and-import screen).
 *
 * Keeping it in one place means author/genre/copy handling can't drift between
 * importers — and one fix benefits all of them.
 */

import type { createClient } from "@/lib/supabase/server";
import { bookSlug, normalizeIsbn } from "@/lib/import";
import { downloadImage, coverVariants, extensionFor, pickGenre, type BookCandidate } from "@/lib/book-search";
import { slugify } from "@/lib/format";

export type Db = Awaited<ReturnType<typeof createClient>>;

export type ImportContext = {
  supabase: Db;
  authors: Map<string, string>;
  genres: Map<string, string>;
};

export function newImportContext(supabase: Db): ImportContext {
  return { supabase, authors: new Map(), genres: new Map() };
}

/** Defaults applied to every imported title. */
export const IMPORT_DEFAULTS = {
  rarity: "common" as const,
  demand: "medium" as const,
  replacementValue: 800,
  copies: 2,
};

/* -------------------------------------------------------------------------- */
/* Lookups                                                                     */
/* -------------------------------------------------------------------------- */

/** Finds a book by ISBN first, then by exact-ish title — same rule as the CSV path. */
export async function findExistingBook(
  ctx: ImportContext,
  isbn: string | null,
  title: string,
): Promise<{ id: string; slug: string } | null> {
  if (isbn) {
    const { data } = await ctx.supabase.from("books").select("id, slug").eq("isbn", isbn).maybeSingle();
    if (data?.id) return { id: data.id as string, slug: data.slug as string };
  }

  const name = title.trim();
  if (name) {
    const { data } = await ctx.supabase
      .from("books")
      .select("id, slug")
      .ilike("title", name)
      .maybeSingle();
    if (data?.id) return { id: data.id as string, slug: data.slug as string };
  }

  return null;
}

/** Finds or creates the author, reusing the run's cache. */
export async function ensureAuthor(ctx: ImportContext, name: string | null | undefined): Promise<string | null> {
  const clean = name?.trim();
  if (!clean) return null;

  const key = clean.toLowerCase();
  const cached = ctx.authors.get(key);
  if (cached) return cached;

  const slug = slugify(clean) || `author-${Date.now().toString(36)}`;
  const { data: existing } = await ctx.supabase.from("authors").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) {
    ctx.authors.set(key, existing.id as string);
    return existing.id as string;
  }

  const { data } = await ctx.supabase
    .from("authors")
    .insert({ name: clean, slug })
    .select("id")
    .single();
  if (data?.id) {
    ctx.authors.set(key, data.id as string);
    return data.id as string;
  }
  return null;
}

/** Finds or creates the genre. Accepts "Thriller, Fiction" and uses the first. */
export async function ensureGenre(ctx: ImportContext, name: string | null | undefined): Promise<string | null> {
  const first = name?.split(",")[0]?.trim();
  if (!first) return null;

  const key = first.toLowerCase();
  const cached = ctx.genres.get(key);
  if (cached) return cached;

  const slug = slugify(first) || `genre-${Date.now().toString(36)}`;
  const { data: existing } = await ctx.supabase.from("genres").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) {
    ctx.genres.set(key, existing.id as string);
    return existing.id as string;
  }

  const { data } = await ctx.supabase
    .from("genres")
    .insert({ name: first, slug })
    .select("id")
    .single();
  if (data?.id) {
    ctx.genres.set(key, data.id as string);
    return data.id as string;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Covers                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Copies a remote cover into the public `book-covers` bucket.
 *
 * Remote hosts (covers.openlibrary.org especially) are slow and drop images, so
 * anything we intend to keep gets re-hosted. Returns null on any failure, which
 * makes the caller keep the original URL instead.
 */
export async function saveCoverToStorage(
  ctx: ImportContext,
  url: string | null,
  hints: { isbn?: string | null; title: string },
  prefix = "cover",
): Promise<string | null> {
  if (!url) return null;

  // Open Library serves several sizes and wedges on some of them, so walk the
  // list until one actually delivers bytes.
  let image = null;
  for (const variant of coverVariants(url)) {
    image = await downloadImage(variant.url, variant.timeoutMs);
    if (image) break;
  }
  if (!image) return null;

  const base =
    hints.isbn?.replace(/[^0-9Xx]/g, "") ||
    slugify(hints.title).slice(0, 60) ||
    Date.now().toString(36);
  const path = `${prefix}/${base}-${Date.now().toString(36)}.${extensionFor(image.contentType)}`;

  const { error } = await ctx.supabase.storage
    .from("book-covers")
    .upload(path, image.bytes, { upsert: false, contentType: image.contentType });
  if (error) {
    console.warn(`[rey] cover upload failed for ${path}: ${error.message}`);
    return null;
  }

  const { data } = ctx.supabase.storage.from("book-covers").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/* -------------------------------------------------------------------------- */
/* Physical copies                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Makes sure the shelf actually holds the copies the catalogue claims.
 *
 * Without this an imported book has `total_copies = 2` but no `book_copies`
 * rows, so fulfilment can never hand one out — rentals silently end up with a
 * null copy_id and the same title can leave the building repeatedly.
 */
export async function syncCopies(
  ctx: ImportContext,
  bookId: string,
  slug: string,
  total: number,
): Promise<void> {
  const wanted = Math.max(1, Math.min(50, Math.floor(total) || 1));

  const { data: existing } = await ctx.supabase
    .from("book_copies")
    .select("copy_code")
    .eq("book_id", bookId);

  const have = new Set((existing ?? []).map((row) => String(row.copy_code)));
  const rows: { book_id: string; copy_code: string; status: string }[] = [];

  for (let index = 1; index <= wanted; index += 1) {
    const code = `${slug}-${String(index).padStart(2, "0")}`;
    if (!have.has(code)) rows.push({ book_id: bookId, copy_code: code, status: "available" });
  }
  if (!rows.length) return;

  // The unique (book_id, copy_code) index makes this idempotent.
  await ctx.supabase
    .from("book_copies")
    .upsert(rows, { onConflict: "book_id,copy_code", ignoreDuplicates: true });
}

/* -------------------------------------------------------------------------- */
/* The import itself                                                           */
/* -------------------------------------------------------------------------- */

export type ImportOptions = {
  /** Publish immediately instead of leaving the title hidden. */
  publish: boolean;
  /** Download the cover into our bucket (slower, but permanent). */
  rehostCover?: boolean;
  /** Copy rows to create for a new title. */
  copies?: number;
};

export type ImportOutcome = "created" | "updated" | "skipped";

/** Writes one candidate into the catalogue, de-duplicating as it goes. */
export async function importCandidate(
  ctx: ImportContext,
  candidate: BookCandidate,
  options: ImportOptions,
): Promise<ImportOutcome> {
  const title = candidate.title.trim();
  if (!title) return "skipped";

  const isbn = normalizeIsbn(candidate.isbn);
  const existing = await findExistingBook(ctx, isbn, title);

  const cover =
    options.rehostCover === false
      ? candidate.coverUrl
      : (await saveCoverToStorage(ctx, candidate.coverUrl, { isbn, title })) ?? candidate.coverUrl;

  const copies = options.copies ?? IMPORT_DEFAULTS.copies;

  const payload: Record<string, unknown> = {
    title,
    subtitle: candidate.subtitle,
    author_id: await ensureAuthor(ctx, candidate.authors[0]),
    genre_id: await ensureGenre(ctx, pickGenre(candidate.subjects)),
    description: candidate.description,
    publisher: candidate.publisher,
    published_year: candidate.year,
    pages: candidate.pages,
    language: candidate.language ?? "English",
    rarity: IMPORT_DEFAULTS.rarity,
    demand: IMPORT_DEFAULTS.demand,
    replacement_value: IMPORT_DEFAULTS.replacementValue,
    total_copies: copies,
    updated_at: new Date().toISOString(),
  };
  if (isbn) payload.isbn = isbn;
  if (cover) payload.cover_url = cover;

  if (existing) {
    // Publishing is opt-in; never silently unpublish something on an update.
    if (options.publish) payload.is_active = true;
    const { error } = await ctx.supabase.from("books").update(payload).eq("id", existing.id);
    if (error) return "skipped";
    await syncCopies(ctx, existing.id, existing.slug, copies);
    return "updated";
  }

  const slug = await uniqueSlug(ctx, bookSlug(title));
  payload.slug = slug;
  payload.is_active = options.publish;

  const { data, error } = await ctx.supabase.from("books").insert(payload).select("id").single();
  if (error || !data?.id) return "skipped";

  await syncCopies(ctx, data.id as string, slug, copies);
  return "created";
}

/** Keeps slugs unique without failing the whole run. */
export async function uniqueSlug(ctx: ImportContext, base: string): Promise<string> {
  let slug = base;
  let attempt = 1;
  for (;;) {
    const { data } = await ctx.supabase.from("books").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}
