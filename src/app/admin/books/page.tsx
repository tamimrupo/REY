import Link from "next/link";

import { deleteBookAction, toggleBookActiveAction } from "@/lib/actions/admin";
import { BookCoverImage } from "@/components/book-cover";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState, StatusPill } from "@/components/ui";
import { getAuthors, getGenres, listBooks } from "@/lib/data";

export const metadata = { title: "Books" };

export default async function AdminBooksPage(props: PageProps<"/admin/books">) {
  const search = await props.searchParams;
  const q = typeof search.q === "string" ? search.q : "";
  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;

  const [{ books, total, pages }, authors, genres] = await Promise.all([
    listBooks({ q, page, perPage: 24, includeInactive: true }),
    getAuthors(),
    getGenres(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-ink">Books</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total} titles · {authors.length} authors · {genres.length} genres
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/books/new" className="btn btn-primary btn-sm">
            Add a book
          </Link>
          <Link href="/library" className="btn btn-outline btn-sm">
            View library
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="field sm:max-w-xs"
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Search
        </button>
        {q ? (
          <Link href="/admin/books" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Rarity</th>
              <th>Copies</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td className="w-12">
                  <div className="h-14 w-10 overflow-hidden rounded border border-line bg-cream">
                    <BookCoverImage
                      url={book.cover_url}
                      title={book.title}
                      size="sm"
                      className="h-full w-full"
                    />
                  </div>
                </td>
                <td className="max-w-[18rem]">
                  <Link href={`/admin/books/${book.id}`} className="font-medium text-ink hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="text-ink-soft">{book.authors?.name ?? "—"}</td>
                <td className="text-ink-soft">{book.genres?.name ?? "—"}</td>
                <td>
                  <StatusPill
                    status={book.rarity === "rare" ? "rare" : "available"}
                    label={book.rarity === "rare" ? "Rare" : "Common"}
                  />
                </td>
                <td className="text-ink-soft">{book.total_copies}</td>
                <td>
                  <StatusPill
                    status={book.is_active ? "active" : "draft"}
                    label={book.is_active ? "Live" : "Hidden"}
                  />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleBookActiveAction}>
                      <input type="hidden" name="id" value={book.id} />
                      <input type="hidden" name="next" value={String(!book.is_active)} />
                      <SubmitButton
                        className="btn btn-outline btn-sm"
                        pendingLabel={book.is_active ? "Hiding…" : "Publishing…"}
                      >
                        {book.is_active ? "Hide" : "Publish"}
                      </SubmitButton>
                    </form>
                    <Link href={`/admin/books/${book.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <form action={deleteBookAction}>
                      <input type="hidden" name="id" value={book.id} />
                      <SubmitButton
                        className="btn btn-ghost btn-sm"
                        pendingLabel="Deleting…"
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {books.length === 0 ? (
        <EmptyState
          title="No books found"
          description="Nothing matches this search. Add a book, or import a batch from Import books."
          actionHref="/admin/import"
          actionLabel="Import books"
        />
      ) : null}

      {pages > 1 ? (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={`/admin/books?${new URLSearchParams({ q, page: String(page - 1) })}`} className="btn btn-outline btn-sm">
              ← Previous
            </Link>
          ) : null}
          <span className="px-3 text-sm text-ink-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/books?${new URLSearchParams({ q, page: String(page + 1) })}`} className="btn btn-outline btn-sm">
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
