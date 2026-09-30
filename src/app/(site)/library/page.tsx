import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/ui";
import { getGenres, getLanguages, listBooks } from "@/lib/data";

export const metadata = { title: "Library" };

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/library?${qs}` : "/library";
}

export default async function LibraryPage(props: PageProps<"/library">) {
  const search = await props.searchParams;
  const q = typeof search.q === "string" ? search.q : "";
  const genre = typeof search.genre === "string" ? search.genre : "";
  const language = typeof search.language === "string" ? search.language : "";
  const rarity = typeof search.rarity === "string" ? search.rarity : "";
  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;

  const [{ books, total, pages }, genres, languages] = await Promise.all([
    listBooks({ q, genre, language, rarity, page, perPage: 24 }),
    getGenres(),
    getLanguages(),
  ]);

  return (
    <>
      <section className="border-b border-line bg-cream/60">
        <div className="container-page py-12">
          <p className="eyebrow">The library</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink">Browse every title</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {total} title{total === 1 ? "" : "s"} available to members. Search by name, or narrow it
            down by genre and language.
          </p>

          <form method="get" className="mt-8 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <div>
              <label className="label" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Title or author…"
                className="field"
              />
            </div>

            <div>
              <label className="label" htmlFor="genre">
                Genre
              </label>
              <select id="genre" name="genre" defaultValue={genre} className="field">
                <option value="">All genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="language">
                Language
              </label>
              <select id="language" name="language" defaultValue={language} className="field">
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" className="btn btn-primary">
                Filter
              </button>
              {q || genre || language || rarity ? (
                <Link href="/library" className="btn btn-ghost">
                  Reset
                </Link>
              ) : null}
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={buildQuery({ q, genre, language })}
              className={`btn btn-sm ${rarity === "" ? "btn-primary" : "btn-outline"}`}
            >
              All titles
            </Link>
            <Link
              href={buildQuery({ q, genre, language, rarity: "rare" })}
              className={`btn btn-sm ${rarity === "rare" ? "btn-primary" : "btn-outline"}`}
            >
              Rare &amp; hard to find
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        {books.length === 0 ? (
          <EmptyState
            title="Nothing matched that search"
            description="Try a different spelling, or clear the filters and browse everything."
            actionHref="/library"
            actionLabel="Clear filters"
          />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={buildQuery({ q, genre, language, rarity, page: String(page - 1) })} className="btn btn-outline btn-sm">
                ← Previous
              </Link>
            ) : null}
            <span className="px-3 text-sm text-ink-muted">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={buildQuery({ q, genre, language, rarity, page: String(page + 1) })} className="btn btn-outline btn-sm">
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </>
  );
}
