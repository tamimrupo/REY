"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { BookCover } from "@/components/book-card";
import { initials } from "@/lib/format";
import type { Book } from "@/lib/types";

/** How long each book stays centred before the shelf advances on its own. */
const AUTOPLAY_MS = 4500;
/** After a manual click, leave the reader alone for a while. */
const QUIET_AFTER_CLICK_MS = 9000;

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
 * Home-page shelf — centre mode.
 *
 * The book in the middle of the rail is "active": it renders larger, and the
 * panel above follows it (author photo, name, genre, and the book's description
 * as a quote). Spacers at each end let the first and last books reach the centre
 * too. The shelf advances by itself, and pauses when you hover, focus, click, or
 * scroll away.
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
  const activeIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const visibleRef = useRef(true);
  const lastClickRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [pad, setPad] = useState(0);

  const cards = useCallback((): HTMLElement[] => {
    const rail = railRef.current;
    return rail ? Array.from(rail.querySelectorAll<HTMLElement>("[data-card]")) : [];
  }, []);

  /** Scroll so that `index` sits in the middle of the rail. */
  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const rail = railRef.current;
      const list = cards();
      const card = list[index];
      if (!rail || !card) return;

      const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
      rail.scrollTo({ left: Math.max(0, left), behavior });
    },
    [cards],
  );

  const commit = useCallback(() => {
    const rail = railRef.current;
    const list = cards();
    if (!rail || !list.length) return;

    // Which card's centre is closest to the rail's centre?
    const railCentre = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    list.forEach((card, index) => {
      const centre = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(centre - railCentre);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    activeIndexRef.current = nearest;
    setActiveIndex(nearest);
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2);
  }, [cards]);

  // Debounced so the panel does not flicker through every book mid-scroll.
  const handleScroll = useCallback(() => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(commit, 110);
  }, [commit]);

  /** End spacers so the first and last book can be centred. */
  const measurePad = useCallback(() => {
    const rail = railRef.current;
    const first = cards()[0];
    if (!rail || !first) return;
    setPad(Math.max(0, (rail.clientWidth - first.offsetWidth) / 2));
  }, [cards]);

  useEffect(() => {
    measurePad();
    commit();

    const onResize = () => {
      measurePad();
      commit();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (settle.current) clearTimeout(settle.current);
    };
  }, [measurePad, commit]);

  // Autoplay. Skipped entirely for reduced-motion users.
  useEffect(() => {
    if (books.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rail = railRef.current;
    const timer = setInterval(() => {
      if (document.hidden || !visibleRef.current) return;
      if (pausedRef.current) return;
      if (Date.now() - lastClickRef.current < QUIET_AFTER_CLICK_MS) return;

      const current = activeIndexRef.current;
      const next = current + 1 >= books.length ? 0 : current + 1;
      // Rewinding the whole shelf instantly is kinder than a long swoop.
      goTo(next, next === 0 ? "auto" : "smooth");
    }, AUTOPLAY_MS);

    // Don't keep scrolling while the shelf is off-screen.
    let observer: IntersectionObserver | undefined;
    if (rail && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          visibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.15 },
      );
      observer.observe(rail);
    }

    return () => {
      clearInterval(timer);
      observer?.disconnect();
    };
  }, [books.length, goTo]);

  const step = (direction: 1 | -1) => {
    lastClickRef.current = Date.now();
    const list = cards();
    if (!list.length) return;
    const current = activeIndexRef.current;
    const next = Math.min(list.length - 1, Math.max(0, current + direction));
    goTo(next);
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

          {active.description ? (
            <blockquote className="mt-7 max-w-2xl">
              <p className="line-clamp-5 text-lg italic leading-relaxed text-ink-soft">
                &ldquo;{active.description}&rdquo;
              </p>
            </blockquote>
          ) : null}
        </div>
      </div>

      {/* The rail. End spacers centre the first and last books; padding gives the
          enlarged card and its shadow room. */}
      <div
        ref={railRef}
        onScroll={handleScroll}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onFocusCapture={() => {
          pausedRef.current = true;
        }}
        onBlurCapture={() => {
          pausedRef.current = false;
        }}
        className="no-scrollbar relative -mx-2 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pt-6 pb-7"
      >
        <div aria-hidden className="shrink-0" style={{ width: pad }} />

        {books.map((book, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={book.id}
              data-card
              href={`/library/${book.slug}`}
              aria-current={isActive ? "true" : undefined}
              className={`group w-40 shrink-0 snap-center transition-transform duration-300 ease-out sm:w-44 lg:w-48 ${
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

        <div aria-hidden className="shrink-0" style={{ width: pad }} />
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-6">
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
