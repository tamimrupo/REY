import Link from "next/link";

import { LibrarySearch } from "@/components/library-search";

import { BookCard } from "@/components/book-card";
import { QuotaBar } from "@/components/quota-bar";
import { EmptyState } from "@/components/ui";
import { getSession } from "@/lib/auth";
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

  const [{ books, total, pages }, genres, languages, session] = await Promise.all([
    listBooks({ q, genre, language, rarity, page, perPage: 24 }),
    getGenres(),
    getLanguages(),
    getSession(),
  ]);

  return (
    <>
      {session ? <QuotaBar userId={session.userId} /> : null}

      <section className="border-b border-line bg-paper">
        <div className="container-page pb-9 pt-10">
          <div className="section-rule">
            <span className="label-mono">The library</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="label-mono">
              {total} title{total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h1>Browse every title</h1>
            <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
              Search by name, or narrow it by genre and language. Every title here is included in a
              plan — pick the ones you want and we deliver them.
            </p>
          </div>

          <LibrarySearch
            q={q}
            genre={genre}
            language={language}
            genres={genres}
            languages={languages}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={buildQuery({ q, genre, language })}
              className="chip"
              data-active={rarity === ""}
            >
              All titles
            </Link>
            <Link
              href={buildQuery({ q, genre, language, rarity: "rare" })}
              className="chip"
              data-active={rarity === "rare"}
            >
              Rare &amp; hard to find
            </Link>

            {q || genre || language || rarity ? (
              <>
                <span aria-hidden className="mx-1 h-4 w-px bg-line" />
                <span className="label-mono">
                  {total} match{total === 1 ? "" : "es"}
                </span>
                <Link href="/library" className="chip ml-auto">
                  Clear all
                </Link>
              </>
            ) : null}
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
              <Link href={buildQuery({ q, genre, language, rarity, page: String(page - 1) })} className="btn btn-ghost btn-sm">
                ← Previous
              </Link>
            ) : null}
            <span className="px-3 text-sm text-ink-muted">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={buildQuery({ q, genre, language, rarity, page: String(page + 1) })} className="btn btn-ghost btn-sm">
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </>
  );
}
