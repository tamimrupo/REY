import Link from "next/link";

import { BookCoverImage } from "@/components/book-cover";
import type { Book } from "@/lib/types";

export function BookCard({ book, badge }: { book: Book; badge?: string }) {
  const author = book.authors?.name;
  const genre = book.genres?.name;
  const flag = badge ?? (book.rarity === "rare" ? "Rare" : null);

  return (
    <Link href={`/library/${book.slug}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-line bg-cream">
        <BookCoverImage
          url={book.cover_url}
          title={book.title}
          author={author}
          label={genre}
          className="h-full w-full transition duration-500 group-hover:scale-[1.03]"
        />

        {flag ? (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2.5 py-1 text-nano font-semibold uppercase tracking-[0.12em] text-paper backdrop-blur">
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

/** The large cover on a book's own page. */
export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  return (
    <BookCoverImage
      url={book.cover_url}
      title={book.title}
      author={book.authors?.name}
      label={book.genres?.name}
      size="lg"
      loading="eager"
      className={className}
    />
  );
}
