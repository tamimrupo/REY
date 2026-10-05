"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { BookCover } from "@/components/book-card";
import { AvatarImage } from "@/components/avatar-image";
import type { ShelfBook } from "@/lib/types";

/** How long each book stays centred before the shelf advances on its own. */
const AUTOPLAY_MS = 4500;
/** After a manual click, leave the reader alone for a while. */
const QUIET_AFTER_CLICK_MS = 5000;

/** Round author avatar for the shelf panel. */
function AuthorAvatar({
  author,
}: {
  author?: { name: string; avatar_url?: string | null } | null;
}) {
  return <AvatarImage name={author?.name ?? "REY BD"} url={author?.avatar_url} variant="circle" />;
}

/**
 * Home-page shelf — centre mode, endless.
 *
 * The book in the middle of the rail is "active": it renders larger, and the
 * panel above follows it (author photo, name, genre, borrow count and the book's
 * description as a quote).
 *
 * Navigation never ends: the arrows wrap around, and autoplay keeps advancing one
 * book at a time forever. It pauses when you hover, focus, click, scroll away or
 * hide the tab, and never runs for reduced-motion users.
 *
 * The list renders three times so the active book always has neighbours: the
 * middle copy is the interactive one, the outer copies let a step past either
 * end continue smoothly into the next copy, after which the rail re-centres
 * invisibly (the content repeats, so the shift cannot be seen). Without them
 * the rail had to park the first book in the middle of an otherwise empty
 * window and every wrap looked like a reset.
 */
export function FeaturedShelf({
  books,
  label,
  children,
}: {
  books: ShelfBook[];
  label?: string;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const visibleRef = useRef(true);
  const lastClickRef = useRef(0);
  /** True when the reader is navigating the shelf by keyboard, not mouse. */
  const keyboardRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayOn, setAutoplayOn] = useState(true);

  const cards = useCallback((): HTMLElement[] => {
    const rail = railRef.current;
    return rail ? Array.from(rail.querySelectorAll<HTMLElement>("[data-card]")) : [];
  }, []);

  /**
   * Scroll so that `index` sits in the middle of the rail.
   *
   * The list renders three times, so every book exists in three places. By
   * default the occurrence nearest the current position is chosen: a step past
   * either end then continues one ordinary step into the neighbouring copy,
   * and `commit` re-centres it invisibly. The mount effect asks for the middle
   * copy explicitly, so the shelf opens on the first book.
   */
  const goTo = useCallback(
    (
      index: number,
      behavior: ScrollBehavior = "smooth",
      copy: 0 | 1 | 2 | "nearest" = "nearest",
    ) => {
      const rail = railRef.current;
      const list = cards();
      const count = books.length;
      if (!rail || !list.length || !count) return;

      let card: HTMLElement | undefined;
      if (copy === "nearest") {
        const centre = rail.scrollLeft + rail.clientWidth / 2;
        let best = Number.POSITIVE_INFINITY;
        for (let i = 0; i < 3; i++) {
          const candidate = list[i * count + index];
          if (!candidate) continue;
          const distance = Math.abs(
            candidate.offsetLeft + candidate.offsetWidth / 2 - centre,
          );
          if (distance < best) {
            best = distance;
            card = candidate;
          }
        }
      } else {
        card = list[copy * count + index];
      }
      if (!card) return;

      const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
      rail.scrollTo({ left: Math.max(0, left), behavior });
    },
    [cards, books.length],
  );

  const commit = useCallback(() => {
    const rail = railRef.current;
    const list = cards();
    const count = books.length;
    if (!rail || !list.length || !count) return;

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

    // A drag — or a step that carried into a neighbouring copy — can settle
    // outside the middle copy. Shift the rail by whole copies — the content
    // repeats, so the correction is invisible — and every later calculation
    // stays inside the middle copy.
    const copy = Math.floor(nearest / count);
    if (copy !== 1) {
      const width = list[count].offsetLeft - list[0].offsetLeft;
      if (width > 0) {
        rail.scrollTo({ left: rail.scrollLeft + (1 - copy) * width, behavior: "auto" });
      }
    }

    const real = nearest % count;
    activeIndexRef.current = real;
    setActiveIndex(real);
  }, [cards, books.length]);

  // Debounced so the panel does not flicker through every book mid-scroll.
  const handleScroll = useCallback(() => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(commit, 110);
  }, [commit]);

  // Centre the first book of the middle copy on load, then keep the reported
  // index in sync.
  useEffect(() => {
    goTo(0, "auto", 1);
    commit();

    const onResize = () => {
      commit();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (settle.current) clearTimeout(settle.current);
    };
  }, [goTo, commit]);

  // Endless autoplay, one book at a time. Skipped for reduced-motion users.
  useEffect(() => {
    if (books.length < 2) return;
    if (!autoplayOn) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rail = railRef.current;
    const timer = setInterval(() => {
      if (document.hidden || !visibleRef.current) return;
      if (pausedRef.current) return;
      if (Date.now() - lastClickRef.current < QUIET_AFTER_CLICK_MS) return;

      // Pause only when the reader is *keyboard*-navigating inside the shelf.
      // A mouse click also focuses a button, so keying off focus alone left the
      // shelf paused for good — that is what made looping look broken.
      const focused = document.activeElement;
      if (keyboardRef.current && rail && focused && rail.contains(focused)) return;

      const count = books.length;
      const next = (activeIndexRef.current + 1) % count;
      // A step past the end simply continues into the next copy; `commit`
      // re-centres invisibly once the scroll settles, so there is no reset.
      goTo(next);
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
  }, [books.length, goTo, autoplayOn]);

  /** Wraps around in both directions, so the shelf never "ends". */
  const step = (direction: 1 | -1) => {
    lastClickRef.current = Date.now();
    const count = books.length;
    if (!cards().length || !count) return;
    const next = (activeIndexRef.current + direction + count) % count;
    // CSS cannot reach a JavaScript scroll, so honour the motion setting by hand.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    goTo(next, reduced ? "auto" : "smooth");
  };

  if (!books.length) return null;

  const active = books[Math.min(activeIndex, books.length - 1)];
  const shown = String(activeIndex + 1).padStart(2, "0");
  const topBorrowed = Math.max(...books.map((book) => book.borrowed ?? 0));

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          {label ? <p className="eyebrow">{label}</p> : null}
          {children}
        </div>

        <div className="flex flex-col" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AuthorAvatar author={active.authors} />
              <span>
                <span className="block font-semibold text-ink">
                  {active.authors?.slug ? (
                    <Link
                      href={`/author/${active.authors.slug}`}
                      className="inline-block py-1 transition hover:underline"
                    >
                      {active.authors.name ?? "REY BD"}
                    </Link>
                  ) : (
                    (active.authors?.name ?? "REY BD")
                  )}
                </span>
                <span className="block text-xs text-ink-muted">
                  {active.genres?.name ? `${active.genres.name} · Author` : "Author"}
                  {active.borrowed ? ` · ${active.borrowed}× borrowed` : ""}
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

      {/* The rail. The list renders three times so the window is always full —
          the middle copy is the interactive one, the outer copies provide the
          run-up to the first book and the run-out after the last, and they let
          a wrap continue smoothly into the next copy. Padding gives the
          enlarged card and its shadow room. */}
      <div
        ref={railRef}
        onScroll={handleScroll}
        onKeyDownCapture={() => {
          keyboardRef.current = true;
        }}
        onMouseDownCapture={() => {
          keyboardRef.current = false;
        }}
        className="no-scrollbar relative -mx-2 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pt-6 pb-7"
      >
        {[0, 1, 2].map((copy) =>
          books.map((book, index) => {
            const isActive = index === activeIndex;
            const isTop = topBorrowed > 0 && (book.borrowed ?? 0) === topBorrowed;
            const interactive = copy === 1;

            return (
              <Link
                key={`${copy}-${book.id}`}
                data-card
                href={`/library/${book.slug}`}
                aria-current={interactive && isActive ? "true" : undefined}
                aria-hidden={interactive ? undefined : true}
                tabIndex={interactive ? undefined : -1}
                className={`group w-40 shrink-0 snap-center transition-transform duration-200 ease-out sm:w-44 lg:w-48 ${
                  isActive ? "scale-[1.07]" : "scale-100"
                }`}
              >
                <div
                  className={`relative overflow-hidden rounded-card transition-shadow duration-200 ${
                    isActive
                      ? "shadow-lift"
                      : "shadow-paper"
                  }`}
                >
                  <BookCover book={book} className="aspect-[2/3] w-full" />

                  {isTop ? (
                    <span className="absolute left-2.5 top-2.5 rounded-field bg-ink px-2.5 py-1 text-nano font-semibold uppercase tracking-[0.12em] text-paper shadow-card">
                      Best seller
                    </span>
                  ) : null}
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
          }),
        )}
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
            The shelf moves on its own, one book at a time and without ever stopping — use
            pause if you want to look.{" "}
            <Link
              href="/library"
              className="text-ink underline decoration-ink/30 hover:decoration-ink"
            >
              Browse the full library
            </Link>{" "}
            to filter by genre, language or author.
          </span>
        </p>

        <div className="flex items-center gap-5">
          <p className="text-sm">
            <span className="text-ink-muted">
              {shown} / {String(books.length).padStart(2, "0")}
            </span>{" "}
            <span className="text-ink">books</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoplayOn((on) => !on)}
              aria-pressed={autoplayOn}
              aria-label={autoplayOn ? "Pause the shelf" : "Play the shelf"}
              className="btn btn-outline btn-sm"
            >
              {autoplayOn ? "❚❚ Pause" : "▶ Play"}
            </button>

            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous book"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-card transition hover:border-ink hover:shadow-paper"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next book"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink shadow-card transition hover:border-ink hover:shadow-paper"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
