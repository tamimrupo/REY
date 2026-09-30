import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard, BookCover } from "@/components/book-card";
import { StatusPill } from "@/components/ui";
import { getBookBySlug, getPlans, listBooks } from "@/lib/data";
import { money } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/library/[slug]">) {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug);
  return { title: book?.title ?? "Book" };
}

export default async function BookDetailPage(props: PageProps<"/library/[slug]">) {
  const { slug } = await props.params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const [plans, related] = await Promise.all([
    getPlans(),
    listBooks({ genre: undefined, perPage: 6 }),
  ]);

  const cheapest = plans.length
    ? plans.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b))
    : null;

  const others = related.books.filter((b) => b.id !== book.id).slice(0, 6);

  return (
    <>
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
            <div className="overflow-hidden rounded-2xl border border-line bg-cream">
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
                by <span className="font-medium text-ink">{book.authors.name}</span>
              </p>
            ) : null}

            {book.description ? (
              <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">{book.description}</p>
            ) : null}

            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 border-y border-line py-6 text-sm">
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
                  <div key={label as string}>
                    <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">{label}</dt>
                    <dd className="mt-1 text-ink">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {cheapest ? (
                <Link href={`/subscribe/${cheapest.slug}`} className="btn btn-primary">
                  Add to a plan from {money(cheapest.price_monthly)}/mo
                </Link>
              ) : null}
              <Link href="/plans" className="btn btn-outline">
                Compare plans
              </Link>
            </div>

            <p className="mt-4 text-xs text-ink-muted">
              Members pick their titles each month. Not a member yet? Choose a plan and build your
              first box.
            </p>
          </div>
        </div>
      </div>

      {others.length ? (
        <section className="border-t border-line">
          <div className="container-page py-16">
            <h2 className="text-2xl font-semibold text-ink">More from the shelves</h2>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {others.map((item) => (
                <BookCard key={item.id} book={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
