import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthorCard } from "@/components/author-card";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/ui";
import { getAuthorBySlug, getAuthorTitles, getAuthorsWithCounts, getBorrowCountsByBook } from "@/lib/data";
import type { Book } from "@/lib/types";

// Public catalogue page with no per-user data — safe to cache. One-hour ISR
// keeps TTFB low instead of hitting Supabase on every request.
export const revalidate = 3600;

export async function generateMetadata(props: PageProps<"/author/[slug]">) {
  const { slug } = await props.params;
  const author = await getAuthorBySlug(slug);
  return {
    title: author ? `${author.name} — books` : "Author",
    description: author?.bio?.slice(0, 150) ?? undefined,
    alternates: { canonical: author ? `/author/${author.slug}` : undefined },
  };
}

export async function generateStaticParams() {
  // Only authors we actually hold titles by get a page. An author with no books
  // would otherwise produce an orphan URL — in the sitemap with nothing on the
  // site linking to it.
  const authors = await getAuthorsWithCounts();
  return authors.map(({ author }) => ({ slug: author.slug }));
}

/**
 * Everything we hold by one author. Reached by tapping the author's name anywhere
 * it appears — on a book page, in the author card, or in the home shelf panel.
 */
export default async function AuthorPage(props: PageProps<"/author/[slug]">) {
  const { slug } = await props.params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [books, borrowCounts] = await Promise.all([
    getAuthorTitles(author.id, undefined, 60),
    getBorrowCountsByBook(),
  ]);

  const borrowTotal = books.reduce((sum, book) => sum + (borrowCounts[book.id] ?? 0), 0);

  // Group the catalogue: a recurring character's novels belong together and read
  // in order, everything else stays a flat shelf.
  const seriesGroups = new Map<string, Book[]>();
  const standalone: Book[] = [];
  for (const item of books) {
    if (item.series) {
      const list = seriesGroups.get(item.series) ?? [];
      list.push(item);
      seriesGroups.set(item.series, list);
    } else {
      standalone.push(item);
    }
  }

  const groups = [...seriesGroups.entries()]
    .map(([name, list]) => ({
      name,
      books: [...list].sort(
        (a, b) =>
          (a.series_order ?? Number.MAX_SAFE_INTEGER) -
            (b.series_order ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title),
      ),
    }))
    .sort((a, b) => b.books.length - a.books.length || a.name.localeCompare(b.name));

  const statsParts = [`${books.length} title${books.length === 1 ? "" : "s"} in the club`];
  if (groups.length) {
    statsParts.push(`${groups.length} series`);
  }
  if (borrowTotal > 0) {
    statsParts.push(`${borrowTotal} borrow${borrowTotal === 1 ? "" : "s"}`);
  }

  const bio =
    author.bio?.trim() ||
    (books.length
      ? `We hold ${books.length} title${books.length === 1 ? "" : "s"} by ${author.name}. Add one to your box and we will bring it to your door.`
      : `${author.name} has titles on our shelves.`);

  return (
    <div className="container-page py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <Link href="/library" className="inline-block py-1.5 hover:text-ink">
          Library
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span aria-current="page">{author.name}</span>
      </nav>

      <div className="mt-8">
        <AuthorCard
          author={{ name: author.name, slug: author.slug, avatar_url: author.avatar_url }}
          stats={statsParts.join(" · ")}
          bio={bio}
          titles={[]}
          linkName={false}
        />
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl">
            {books.length === 1 ? "The book" : "All books"} by {author.name}
          </h2>
          <Link href="/library" className="btn btn-outline btn-sm">
            Browse the full library
          </Link>
        </div>

        {books.length ? (
          <div className="mt-8 space-y-12">
            {groups.map((group) => (
              <div key={group.name}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
                  <h3 className="text-lg font-semibold text-ink">{group.name} series</h3>
                  <p className="label-mono">
                    {group.books.length} book{group.books.length === 1 ? "" : "s"} · read in order
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {group.books.map((item) => (
                    <BookCard
                      key={item.id}
                      book={item}
                      badge={item.series_order ? `Book ${item.series_order}` : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}

            {standalone.length ? (
              <div>
                {groups.length ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
                    <h3 className="text-lg font-semibold text-ink">Standalone</h3>
                    <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                      {standalone.length} book{standalone.length === 1 ? "" : "s"}
                    </p>
                  </div>
                ) : null}
                <div
                  className={`grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 ${
                    groups.length ? "mt-6" : ""
                  }`}
                >
                  {standalone.map((item) => (
                    <BookCard key={item.id} book={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Nothing on the shelves yet"
              description={`We do not hold any titles by ${author.name} right now. Send us a request and we will try to source one.`}
              actionHref="/rare"
              actionLabel="Request a book"
            />
          </div>
        )}
      </section>
    </div>
  );
}
