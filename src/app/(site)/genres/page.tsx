import Link from "next/link";

import { getGenres } from "@/lib/data";
import { openGraph } from "@/lib/open-graph";

export const metadata = {
  title: "Browse Books by Genre",
  description:
    "Browse books to rent in Bangladesh by genre — fiction, romance, thriller, self-help and more, delivered to your door and collected when you're done.",
  alternates: { canonical: "/genres" },
  openGraph: openGraph({ url: "/genres" }),
};

export default async function GenresPage() {
  // Only the curated genres (sort_order > 0) get a landing page. Auto-imported
  // subject headings stay out of the index.
  const genres = (await getGenres()).filter((genre) => genre.sort_order > 0);

  return (
    <div className="container-page py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <Link href="/library" className="inline-block py-1.5 hover:text-ink">
          Library
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span aria-current="page">Genres</span>
      </nav>

      <div className="section-rule mt-7">
        <span className="label-mono">Browse by genre</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="label-mono">
          {genres.length} genre{genres.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1>Browse by genre</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
          Rent books by the month, one genre at a time — delivered to your door and collected when
          you&apos;re done.
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {genres.map((genre) => (
          <li key={genre.id}>
            <Link
              href={`/genre/${genre.slug}`}
              className="group flex items-center justify-between rounded-card border border-line bg-white p-5 shadow-paper transition hover:-translate-y-0.5"
            >
              <span className="font-display text-base font-semibold leading-snug text-ink group-hover:underline">
                {genre.name}
              </span>
              <span aria-hidden className="text-ink-muted">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
