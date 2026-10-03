import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthorForm } from "@/components/admin/author-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit author" };

export default async function AdminAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: author } = await supabase
    .from("authors")
    .select("id, name, slug, avatar_url, bio, books(id, title)")
    .eq("id", id)
    .maybeSingle();

  if (!author) notFound();

  const books = (author.books ?? []) as unknown as { id: string; title: string }[];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/authors"
          className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-ink"
        >
          ← Authors
        </Link>
        <h1 className="mt-2 text-ink">{author.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {books.length} book{books.length === 1 ? "" : "s"} in the catalogue
          {author.slug ? (
            <>
              {" · "}
              <Link
                href={`/author/${author.slug}`}
                className="underline decoration-ink/30 hover:decoration-ink"
              >
                view their page
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className="card p-6">
        <AuthorForm
          author={{
            id: author.id as string,
            name: author.name as string,
            slug: (author.slug as string | null) ?? "",
            avatarUrl: (author.avatar_url as string | null) ?? "",
            bio: (author.bio as string | null) ?? "",
          }}
        />
      </div>

      {books.length ? (
        <div className="border-t border-ink pt-5">
          <p className="label-mono">Books by {author.name}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {books.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/admin/books/${book.id}`}
                  className="text-ink underline decoration-ink/30 hover:decoration-ink"
                >
                  {book.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
