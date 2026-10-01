import Link from "next/link";

import { AvatarImage } from "@/components/avatar-image";
import type { Book } from "@/lib/types";

/**
 * Author card shown on every book page: portrait over a disc, name, a couple of
 * honest stats, the bio, a signature-style name and their other titles.
 *
 * Monochrome by design — the reference uses a red disc behind the portrait, so
 * here it is a black disc instead.
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
  return (
    <section className="card overflow-hidden">
      <div className="grid gap-9 p-7 sm:grid-cols-[164px_1fr] sm:gap-11 sm:p-9">
        {/* Portrait over a disc, like the reference. */}
        <div className="relative mx-auto w-36 shrink-0 sm:mx-0 sm:w-full">
          <span
            aria-hidden
            className="absolute left-1/2 top-[40%] h-[126px] w-[126px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink sm:h-[150px] sm:w-[150px]"
          />
          <div className="relative overflow-hidden rounded-card border border-line bg-white shadow-[0_18px_34px_-18px_rgba(0,0,0,0.55)]">
            <AvatarImage name={author.name} url={author.avatar_url} />
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl">
            {linkName && author.slug ? (
              <Link
                href={`/author/${author.slug}`}
                className="transition hover:text-ink-muted"
              >
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </h2>
          {stats ? <p className="mt-2 text-sm text-ink-muted">{stats}</p> : null}

          <div aria-hidden className="mt-5 h-px w-14 bg-ink" />

          <p className="mt-5 leading-relaxed text-ink-soft">{bio}</p>

          {/* Signature block. */}
          <p className="mt-7 text-2xl italic leading-none text-ink">{author.name}</p>
          <p className="mt-2 text-micro uppercase tracking-[0.12em] text-ink-muted">
            Author
          </p>

          {linkName && author.slug ? (
            <Link href={`/author/${author.slug}`} className="btn btn-outline btn-sm mt-6">
              All books by {author.name} <span aria-hidden>→</span>
            </Link>
          ) : null}

          {titles.length ? (
            <div className="mt-7 border-t border-line pt-5">
              <p className="text-micro uppercase tracking-[0.12em] text-ink-muted">
                More by this author
              </p>
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
