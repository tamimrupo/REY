import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/book-card";
import { JsonLd } from "@/components/json-ld";
import { EmptyState } from "@/components/ui";
import { getGenres, getPlans, listBooks } from "@/lib/data";
import { money } from "@/lib/format";
import { getGenreCopy } from "@/lib/genre-copy";
import { breadcrumbJsonLd } from "@/lib/jsonld";

// Public catalogue page with no per-user data — safe to cache. One-hour ISR
// keeps TTFB low instead of hitting Supabase on every request.
export const revalidate = 3600;

export async function generateMetadata(props: PageProps<"/genre/[slug]">) {
  const { slug } = await props.params;
  const genre = (await getGenres()).find((g) => g.slug === slug);
  if (!genre) return {};
  const copy = getGenreCopy(genre.name, genre.slug);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/genre/${genre.slug}` },
  };
}

export async function generateStaticParams() {
  const genres = (await getGenres()).filter((genre) => genre.sort_order > 0);
  return genres.map((genre) => ({ slug: genre.slug }));
}

export default async function GenrePage(props: PageProps<"/genre/[slug]">) {
  const { slug } = await props.params;
  const genre = (await getGenres()).find((g) => g.slug === slug);
  if (!genre) notFound();

  const [{ books, total }, plans] = await Promise.all([
    listBooks({ genre: genre.slug, perPage: 24 }),
    getPlans(),
  ]);
  const copy = getGenreCopy(genre.name, genre.slug, total);
  const cheapest = plans.length
    ? plans.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b))
    : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Genres", path: "/genres" },
          { name: genre.name, path: `/genre/${genre.slug}` },
        ])}
      />

      <section className="border-b border-line bg-paper">
        <div className="container-page pb-10 pt-10">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
            <Link href="/genres" className="inline-block py-1.5 hover:text-ink">
              Genres
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span aria-current="page">{genre.name}</span>
          </nav>

          <div className="section-rule mt-7">
            <span className="label-mono">Genre</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="label-mono">
              {total} title{total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h1>{copy.title}</h1>
            {cheapest ? (
              <Link href={`/subscribe/${cheapest.slug}`} className="btn btn-primary">
                Join from {money(cheapest.price_monthly)}/mo
              </Link>
            ) : null}
          </div>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft">{copy.intro}</p>
        </div>
      </section>

      <section className="container-page py-12">
        {books.length ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${genre.name.toLowerCase()} titles yet`}
            description="This shelf is being stocked. Browse the full library, or request a title and we will try to add it."
            actionHref="/library"
            actionLabel="Browse the library"
          />
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/plans" className="btn btn-outline">
            Compare plans
          </Link>
          <Link href="/library" className="btn btn-ghost">
            Browse all titles
          </Link>
        </div>
      </section>
    </>
  );
}
