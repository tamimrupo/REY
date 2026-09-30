"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { BookCover } from "@/components/book-card";
import type { Book } from "@/lib/types";

/**
 * Horizontal book shelf with prev/next controls and a live position counter,
 * e.g. "04 / 60 books". Items snap, the rail bleeds past the container edge so
 * it reads as scrollable, and the arrows disable at each end.
 */
export function BookCarousel({ books, total }: { books: Book[]; total: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    // Which card is nearest the left edge?
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

    setPosition(nearest);
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.children[0] as HTMLElement | undefined;
    const stride = card ? card.offsetWidth + 24 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: stride * direction * 2, behavior: "smooth" });
  };

  if (!books.length) return null;

  const shown = String(position + 1).padStart(2, "0");

  return (
    <div>
      <div
        ref={railRef}
        onScroll={measure}
        className="no-scrollbar -mr-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:-mr-10"
      >
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/library/${book.slug}`}
            className="group w-40 shrink-0 snap-start sm:w-44 lg:w-48"
          >
            <div className="overflow-hidden rounded-xl shadow-[0_18px_30px_-18px_rgba(0,0,0,0.5)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_26px_40px_-20px_rgba(0,0,0,0.55)]">
              <BookCover book={book} className="aspect-[2/3] w-full" />
            </div>
            <p className="mt-4 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:underline">
              {book.title}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
              {book.authors?.name ?? book.genres?.name ?? "REY BD"}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <p className="flex max-w-xl items-start gap-2 text-sm text-ink-muted">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6.2v.1M10 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>
            Not sure where to start?{" "}
            <Link href="/library" className="text-ink underline decoration-ink/30 hover:decoration-ink">
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
              aria-label="Previous books"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:border-ink hover:shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={atEnd}
              aria-label="More books"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:border-ink hover:shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
