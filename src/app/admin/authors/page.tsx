import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Authors" };

/**
 * Every author in the catalogue, with what is missing from their record: a
 * photo, a bio, a Bangla name. Editing happens on their own screen, one click
 * from here, rather than by opening one of their books.
 */
export default async function AdminAuthorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("id, name, slug, avatar_url, bio, books(count)")
    .order("name");

  const authors = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string | null) ?? "",
    hasPhoto: Boolean(row.avatar_url),
    hasBio: Boolean(row.bio),
    books: (row.books as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  const missing = authors.filter((author) => !author.hasPhoto || !author.hasBio).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono">Catalogue</p>
        <h1 className="mt-2 text-ink">Authors</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          {authors.length} authors. {missing ? `${missing} are missing a photo or a bio. ` : ""}
          Editing one updates them on every book they carry.
        </p>
      </div>

      {authors.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Photo</th>
                <th>Bio</th>
                <th>Books</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id}>
                  <td>
                    <span className="font-medium text-ink">{author.name}</span>
                    {author.slug ? (
                      <span className="mt-0.5 block text-xs text-ink-muted">/author/{author.slug}</span>
                    ) : null}
                  </td>
                  <td data-label="Photo">
                    {author.hasPhoto ? "Added" : <span className="text-ink-muted">None</span>}
                  </td>
                  <td data-label="Bio">
                    {author.hasBio ? "Written" : <span className="text-ink-muted">Empty</span>}
                  </td>
                  <td data-label="Books">{author.books}</td>
                  <td>
                    <Link href={`/admin/authors/${author.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No authors yet"
          description="Authors are created as you add or import books."
          actionHref="/admin/import"
          actionLabel="Import books"
        />
      )}
    </div>
  );
}
