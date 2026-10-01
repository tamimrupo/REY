import Link from "next/link";

import { BookForm } from "@/components/admin/book-form";
import { getAuthors, getGenres } from "@/lib/data";

export const metadata = { title: "Add a book" };

export default async function NewBookPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const { title } = await searchParams;
  const [authors, genres] = await Promise.all([getAuthors(), getGenres()]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/books" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-ink">
          ← Books
        </Link>
        <h1 className="mt-2 text-ink">Add a book</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Upload a cover, set the author and genre, and choose whether members can rent it.
        </p>
      </div>

      <div className="card p-6">
        <BookForm authors={authors} genres={genres} defaults={{ title: title?.trim() ?? "" }} />
      </div>
    </div>
  );
}
