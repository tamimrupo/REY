import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthorCard } from "@/components/author-card";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/ui";
import { getAuthorBySlug, getAuthorTitles, getBorrowCountsByBook } from "@/lib/data";

export async function generateMetadata(props: PageProps<"/author/[slug]">) {
  const { slug } = await props.params;
  const author = await getAuthorBySlug(slug);
  return {
    title: author ? `${author.name} — books` : "Author",
    description: author?.bio?.slice(0, 150) ?? undefined,
  };
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
  const statsParts = [`${books.length} title${books.length === 1 ? "" : "s"} in the club`];
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
      <nav className="text-xs text-ink-muted">
        <Link href="/library" className="hover:text-ink">
          Library
        </Link>
        <span className="mx-2">/</span>
        <span>{author.name}</span>
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
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
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
