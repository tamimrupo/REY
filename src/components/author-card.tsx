import Link from "next/link";

import { AvatarImage } from "@/components/avatar-image";
import type { Book } from "@/lib/types";

/**
 * Author card shown on every book page: portrait, name, honest stats, the bio,
 * and their other titles.
 *
 * Set as an editorial block under a rule rather than a boxed card — and without
 * the decorative disc the WordPress reference used, which added nothing the
 * portrait did not already say.
 */
export function AuthorCard({
  author,
  stats,
  bio,
  titles,
  linkName = true,
}: {
  author: { name: string; slug?: string; avatar_url?: string | null };
  stats: string;
  bio: string;
  titles: Book[];
  /** Off when the card is already on that author's own page. */
  linkName?: boolean;
}) {
  const canLink = Boolean(linkName && author.slug);

  return (
    <section className="border-t border-ink pt-7">
      <div className="grid gap-8 sm:grid-cols-[164px_1fr] sm:gap-10">
        <div className="w-32 sm:w-full">
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <AvatarImage name={author.name} url={author.avatar_url} />
          </div>
        </div>

        <div className="min-w-0">
          <p className="label-mono">Author</p>

          <h2 className="mt-3 text-2xl sm:text-3xl">
            {canLink ? (
              <Link href={`/author/${author.slug}`} className="hover:underline">
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </h2>

          {stats ? <p className="mt-2 text-sm text-ink-muted">{stats}</p> : null}

          <p className="mt-5 max-w-2xl leading-relaxed text-ink-soft">{bio}</p>

          {canLink ? (
            <Link href={`/author/${author.slug}`} className="btn btn-outline btn-sm mt-6">
              All books by {author.name} <span aria-hidden>→</span>
            </Link>
          ) : null}

          {titles.length ? (
            <div className="mt-7 border-t border-ink pt-5">
              <p className="label-mono">More by this author</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {titles.map((title) => (
                  <li key={title.id}>
                    <Link
                      href={`/library/${title.slug}`}
                      className="text-ink underline decoration-ink/30 hover:decoration-ink"
                    >
                      {title.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
