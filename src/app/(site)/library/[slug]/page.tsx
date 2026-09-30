import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToBoxButton } from "@/components/add-to-box-button";
import { AuthorCard } from "@/components/author-card";
import { BookCard, BookCover } from "@/components/book-card";
import { QuotaBar } from "@/components/quota-bar";
import { StatusPill } from "@/components/ui";
import { getSession } from "@/lib/auth";
import {
  getAuthorTitles,
  getBookBySlug,
  getBorrowCountsByBook,
  getPlans,
  getReadNext,
  getSeriesBooks,
} from "@/lib/data";
import { money } from "@/lib/format";
import type { Book } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/library/[slug]">) {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug);
  return { title: book?.title ?? "Book" };
}

export default async function BookDetailPage(props: PageProps<"/library/[slug]">) {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const [plans, session, authorTitles, borrowCounts, seriesBooks, readNext] = await Promise.all([
    getPlans(),
    getSession(),
    book.author_id ? getAuthorTitles(book.author_id, book.id, 5) : Promise.resolve([]),
    book.author_id
      ? getBorrowCountsByBook()
      : Promise.resolve({} as Record<string, number>),
    book.series ? getSeriesBooks(book.series) : Promise.resolve<Book[]>([]),
    getReadNext(book),
  ]);

  // Honest author stats: how many of their titles we hold, and how often those
  // have actually been borrowed. No invented star ratings.
  const authorName = book.authors?.name ?? "this author";
  const titleCount = authorTitles.length + 1;
  const borrowTotal =
    authorTitles.reduce((sum, title) => sum + (borrowCounts[title.id] ?? 0), 0) +
    (borrowCounts[book.id] ?? 0);

  const statsParts = [`${titleCount} title${titleCount === 1 ? "" : "s"} in the club`];
  if (borrowTotal > 0) {
    statsParts.push(`${borrowTotal} borrow${borrowTotal === 1 ? "" : "s"}`);
  }

  const writtenBio = book.authors?.bio?.trim();
  const authorBio = writtenBio
    ? writtenBio
    : authorTitles.length
      ? `We hold ${titleCount} titles by ${authorName} in the club, including ${authorTitles
          .slice(0, 2)
          .map((title) => title.title)
          .join(" and ")}. Add one to your box and we will bring it to your door.`
      : `${authorName} has a title on our shelves. Add it to your box and we will bring it to your door.`;

  const cheapest = plans.length
    ? plans.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b))
    : null;

  return (
    <>
      {session ? <QuotaBar userId={session.userId} /> : null}

      <div className="container-page py-10">
        <nav className="text-xs text-ink-muted">
          <Link href="/library" className="hover:text-ink">
            Library
          </Link>
          <span className="mx-2">/</span>
          <span>{book.genres?.name ?? "All titles"}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-[380px_1fr]">
          <div>
            <div className="overflow-hidden rounded-[6px] border border-line bg-cream shadow-[0_18px_40px_-30px_rgba(9,9,9,0.5)]">
              <BookCover book={book} className="aspect-[2/3] w-full" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {book.rarity === "rare" ? <StatusPill status="rare" label="Rare" /> : null}
              {book.is_active ? (
                <StatusPill status="available" label="In the library" />
              ) : (
                <StatusPill status="pending" label="Coming soon" />
              )}
              {book.language ? (
                <span className="pill bg-zinc-100 text-zinc-600">{book.language}</span>
              ) : null}
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink">{book.title}</h1>
            {book.subtitle ? (
              <p className="mt-2 text-lg text-ink-muted">{book.subtitle}</p>
            ) : null}

            {book.authors?.name ? (
              <p className="mt-4 text-ink-soft">
                by{" "}
                {book.authors.slug ? (
                  <Link
                    href={`/author/${book.authors.slug}`}
                    className="font-medium text-ink underline decoration-ink/30 hover:decoration-ink"
                  >
                    {book.authors.name}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{book.authors.name}</span>
                )}
              </p>
            ) : null}

            {book.series ? (
              <p className="mt-3 text-sm text-ink-muted">
                {book.series_order ? `Book ${book.series_order}` : "Part"} of the{" "}
                <span className="font-medium text-ink">{book.series}</span> series
                {seriesBooks.length > 1 ? ` · ${seriesBooks.length} in the club` : ""}
              </p>
            ) : null}

            {book.description ? (
              <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">{book.description}</p>
            ) : null}

            <dl className="mt-10 max-w-xl divide-y divide-line border-y border-ink text-sm">
              {[
                ["Genre", book.genres?.name],
                ["Language", book.language],
                ["Pages", book.pages ? String(book.pages) : null],
                ["Published", book.published_year ? String(book.published_year) : null],
                ["Publisher", book.publisher],
                ["ISBN", book.isbn],
                ["Copies", String(book.total_copies)],
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline gap-6 py-3">
                    <dt className="label-mono w-28 shrink-0">{label}</dt>
                    <dd className="min-w-0 flex-1 text-ink">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <AddToBoxButton
                bookId={book.id}
                back={`/library/${book.slug}`}
                className="btn btn-primary"
                label="Add to my box"
              />
              {cheapest ? (
                <Link href={`/subscribe/${cheapest.slug}`} className="btn btn-outline">
                  Join from {money(cheapest.price_monthly)}/mo
                </Link>
              ) : null}
              <Link href="/plans" className="btn btn-ghost">
                Compare plans
              </Link>
            </div>

            <p className="mt-4 text-xs text-ink-muted">
              Members pick their titles each month — put this in your box and confirm it when you
              are ready. Not a member yet? Choose a plan and build your first box.
            </p>
          </div>
        </div>
      </div>

      {book.authors?.name ? (
        <div className="container-page pb-16">
          <AuthorCard
            author={{
              name: book.authors.name,
              slug: book.authors.slug,
              avatar_url: book.authors.avatar_url,
            }}
            stats={statsParts.join(" · ")}
            bio={authorBio}
            titles={authorTitles}
          />
        </div>
      ) : null}

      {readNext.length ? (
        <section className="border-t border-line">
          <div className="container-page py-16">
            <h2 className="text-2xl font-semibold text-ink">Read this next</h2>

            <div className="mt-9 space-y-12">
              {readNext.map((section) => (
                <div key={section.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold text-ink">{section.title}</h3>
                    {section.hint ? (
                      <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                        {section.hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {section.books.map((item) => (
                      <BookCard key={item.id} book={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
