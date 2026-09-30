import Link from "next/link";

import { AvatarImage } from "@/components/avatar-image";
import { EmptyState } from "@/components/ui";
import { getAuthorsWithCounts } from "@/lib/data";

export const metadata = {
  title: "Authors",
  description:
    "Every author on our shelves, with their photo and how many titles the club holds.",
};

/**
 * The whole roster on one page. Tapping a face opens that author's own page, so
 * a reader can go: shelf → author → the series they actually want.
 */
export default async function AuthorsPage() {
  const authors = await getAuthorsWithCounts();
  const seriesCount = new Set(authors.flatMap((entry) => entry.series)).size;

  return (
    <div className="container-page py-12">
      <nav className="text-xs text-ink-muted">
        <Link href="/library" className="hover:text-ink">
          Library
        </Link>
        <span className="mx-2">/</span>
        <span>Authors</span>
      </nav>

      <div className="section-rule mt-7">
        <span className="label-mono">Contributors</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="label-mono">
          {authors.length} author{authors.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1 className="text-4xl sm:text-5xl">Authors on our shelves</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
          {seriesCount ? `${seriesCount} series, ` : ""}
          {authors.length} writers we hold titles by. Tap one to see everything, and what to read
          next.
        </p>
      </div>

      {authors.length ? (
        <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {authors.map(({ author, titles, series }) => (
            <li key={author.id}>
              <Link href={`/author/${author.slug}`} className="group block">
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-[40%] h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition group-hover:scale-105"
                  />
                  <div className="relative overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.55)]">
                    <AvatarImage name={author.name} url={author.avatar_url} />
                  </div>
                </div>

                <p className="mt-4 font-display text-base font-semibold leading-snug text-ink group-hover:underline">
                  {author.name}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {titles} title{titles === 1 ? "" : "s"}
                </p>
                {series.length ? (
                  <p className="mt-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
                    {series.slice(0, 2).join(" · ")}
                    {series.length > 2 ? ` +${series.length - 2}` : ""}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="No authors yet"
            description="Import a few books and their authors will appear here automatically."
            actionHref="/library"
            actionLabel="Browse the library"
          />
        </div>
      )}
    </div>
  );
}
