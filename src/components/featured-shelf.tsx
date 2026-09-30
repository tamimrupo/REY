"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { BookCover } from "@/components/book-card";
import { initials } from "@/lib/format";
import type { Book } from "@/lib/types";

/** Round author avatar: photo when we have one, initials when we do not. */
function AuthorAvatar({
  author,
}: {
  author?: { name: string; avatar_url?: string | null } | null;
}) {
  if (author?.avatar_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={author.avatar_url}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-line"
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper"
    >
      {initials(author?.name ?? "REY BD")}
    </span>
  );
}

/**
 * Home-page shelf.
 *
 * The book nearest the left edge is "active": it renders larger, and the panel
 * above it follows it — author photo, author name, genre and the book's
 * description. The arrows move exactly one book at a time.
 *
 * The left column is passed in as children so the page keeps its own copy.
 */
export function FeaturedShelf({
  books,
  total,
  children,
}: {
  books: Book[];
  total: number;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const commit = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rail.children.length; i += 1) {
      const child = rail.children[i] as HTMLElement;
      const distance = Math.abs(child.offsetLeft - rail.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
    }

    setActiveIndex(nearest);
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2);
  }, []);

  // Debounced so the panel does not flicker through every book mid-scroll.
  const handleScroll = useCallback(() => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(commit, 110);
  }, [commit]);

  useEffect(() => {
    commit();
    window.addEventListener("resize", commit);
    return () => {
      window.removeEventListener("resize", commit);
      if (settle.current) clearTimeout(settle.current);
    };
  }, [commit]);

  /** One book per click. */
  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.children[0] as HTMLElement | undefined;
    const stride = card ? card.offsetWidth + 24 : rail.clientWidth * 0.5;
    rail.scrollBy({ left: stride * direction, behavior: "smooth" });
  };

  if (!books.length) return null;

  const active = books[Math.min(activeIndex, books.length - 1)];
  const shown = String(activeIndex + 1).padStart(2, "0");

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>{children}</div>

        <div className="flex flex-col" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AuthorAvatar author={active.authors} />
              <span>
                <span className="block font-semibold text-ink">
                  {active.authors?.name ?? "REY BD"}
                </span>
                <span className="block text-xs text-ink-muted">
                  {active.genres?.name ? `${active.genres.name} · Author` : "Author"}
                </span>
              </span>
            </div>

            <Link href={`/library/${active.slug}`} className="btn btn-ghost btn-sm">
              View book <span aria-hidden>→</span>
            </Link>
          </div>

          <p className="mt-7 line-clamp-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {active.description}
          </p>
        </div>
      </div>

      {/* The rail. Padding gives the enlarged card and its shadow room to breathe. */}
      <div
        ref={railRef}
        onScroll={handleScroll}
        className="no-scrollbar -mr-6 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pt-6 pb-7 lg:-mr-10"
      >
        {books.map((book, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={book.id}
              href={`/library/${book.slug}`}
              aria-current={isActive ? "true" : undefined}
              className={`group w-40 shrink-0 snap-start transition-transform duration-300 ease-out sm:w-44 lg:w-48 ${
                isActive ? "scale-[1.07]" : "scale-100"
              }`}
            >
              <div
                className={`overflow-hidden rounded-xl transition-shadow duration-300 ${
                  isActive
                    ? "shadow-[0_30px_52px_-22px_rgba(0,0,0,0.62)]"
                    : "shadow-[0_16px_28px_-18px_rgba(0,0,0,0.45)]"
                }`}
              >
                <BookCover book={book} className="aspect-[2/3] w-full" />
              </div>

              <p
                className={`mt-4 line-clamp-2 text-sm leading-snug text-ink group-hover:underline ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {book.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                {book.authors?.name ?? book.genres?.name ?? "REY BD"}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <p className="flex max-w-xl items-start gap-2 text-sm text-ink-muted">
          <svg aria-hidden viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 6.2v.1M10 9v5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>
            Not sure where to start?{" "}
            <Link
              href="/library"
              className="text-ink underline decoration-ink/30 hover:decoration-ink"
            >
              Browse the full library
            </Link>{" "}
            and filter by genre, language or author — we add new titles every week.
          </span>
        </p>

        <div className="flex items-center gap-5">
          <p className="text-sm">
            <span className="text-ink-muted">
              {shown} / {String(total).padStart(2, "0")}
            </span>{" "}
            <span className="text-ink">books</span>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={atStart}
              aria-label="Previous book"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:border-ink hover:shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={atEnd}
              aria-label="Next book"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:border-ink hover:shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
