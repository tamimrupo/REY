import Link from "next/link";
import { notFound } from "next/navigation";

import { BookForm } from "@/components/admin/book-form";
import { getAuthors, getBookById, getGenres } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Edit book" };

export default async function EditBookPage(props: PageProps<"/admin/books/[id]">) {
  const { id } = await props.params;
  const [book, authors, genres] = await Promise.all([
    getBookById(id),
    getAuthors(),
    getGenres(),
  ]);

  if (!book) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/books" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-gold">
            ← Books
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{book.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Added {formatDate(book.created_at)} · /library/{book.slug}
          </p>
        </div>
        <Link href={`/library/${book.slug}`} className="btn btn-outline btn-sm">
          View on site
        </Link>
      </div>

      <div className="card p-6">
        <BookForm book={book} authors={authors} genres={genres} />
      </div>
    </div>
  );
}
