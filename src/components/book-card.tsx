import Link from "next/link";

import type { Book } from "@/lib/types";

export function BookCard({ book, badge }: { book: Book; badge?: string }) {
  const author = book.authors?.name;
  const genre = book.genres?.name;
  const flag = badge ?? (book.rarity === "rare" ? "Rare" : null);

  return (
    <Link href={`/library/${book.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-cream">
        {book.cover_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between bg-gradient-to-b from-mist to-frost p-4">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted">
              {genre ?? "REY"}
            </span>
            <span className="font-display text-sm font-semibold leading-snug text-ink">
              {book.title}
            </span>
            <span className="text-[0.6rem] text-ink-muted">{author}</span>
          </div>
        )}

        {flag ? (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper backdrop-blur">
            {flag}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-gold">
          {book.title}
        </p>
        {author ? <p className="mt-1 text-xs text-ink-muted">{author}</p> : null}
      </div>
    </Link>
  );
}

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  if (book.cover_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={book.cover_url} alt={book.title} className={`object-cover ${className}`} />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-b from-mist to-frost p-3 text-center ${className}`}>
      <span className="font-display text-sm font-semibold leading-snug text-ink">{book.title}</span>
    </div>
  );
}
