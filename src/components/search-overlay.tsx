"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BookCoverImage } from "@/components/book-cover";

type Hit = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  description: string | null;
  language: string | null;
  pages: number | null;
  published_year: number | null;
  authors: { name: string; slug: string | null } | null;
  genres: { name: string; slug: string } | null;
};

type GenreHit = { name: string; slug: string; books: number };

function Magnifier({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The header search: an icon that opens a panel with live matches, like the
 * storefront the owner referenced. Left column lists matching categories and
 * books; the right column previews whichever book is highlighted, so the person
 * can see the cover before committing to a click.
 *
 * Arrow keys move through results, Enter opens one, Escape closes.
 */
export function SearchOverlay() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Hit[]>([]);
  const [genres, setGenres] = useState<GenreHit[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  // Focus goes back to the button that opened the search — never on mount.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // While the search is open: Escape closes it from anywhere, a click outside
  // closes it, Tab stays inside it, and the page behind it holds still.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // Close when the click lands anywhere outside the search.
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  // Ask the server shortly after typing stops.
  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (cancelled) return;

        setBooks((payload.books ?? []) as Hit[]);
        setGenres((payload.genres ?? []) as GenreHit[]);
        setTotal(typeof payload.totalBooks === "number" ? payload.totalBooks : 0);
        setActive(0);
      } catch {
        // Aborted or offline: leave what is already on screen.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const current = books[active] ?? null;
  const trimmed = query.trim();
  const meta = current
    ? [current.authors?.name, current.published_year, current.pages ? `${current.pages} pp` : null, current.language]
        .filter(Boolean)
        .join(" · ")
    : "";

  const go = (hit: Hit) => {
    setOpen(false);
    // The panel closes at once; tell the progress bar a route is starting, since
    // this navigation has no link for the page to notice.
    window.dispatchEvent(new Event("route:start"));
    router.push(`/library/${hit.slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(0, books.length - 1)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && current) {
      event.preventDefault();
      go(current);
    }
  };

  return (
    <div ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="site-search-overlay"
        aria-label="Search the library"
        className={`btn btn-ghost btn-sm ${open ? "text-ink" : ""}`}
      >
        <Magnifier />
        <span className="hidden sm:inline">Search</span>
      </button>

      {/* The rest of the page goes quiet behind the search, and a click on it
          closes the panel. Rendered on the body because the header's backdrop
          blur would otherwise trap a fixed child inside the bar. */}
      {open
        ? createPortal(
            <div
              aria-hidden
              className="animate-fade-in fixed inset-0 z-30 bg-ink/35"
              onClick={() => setOpen(false)}
            />,
            document.body,
          )
        : null}

      {open ? (
        <div
          id="site-search-overlay"
          ref={panelRef}
          role="dialog"
          aria-label="Search the library"
          className="animate-pop absolute left-0 right-0 top-full z-50 border-b border-ink bg-cream shadow-lift"
        >
          <div className="container-page py-10">
            <div className="relative max-w-2xl">
              <label className="sr-only" htmlFor="site-search">
                Search the library
              </label>
              <input
                id="site-search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search a title, an author or a genre"
                autoComplete="off"
                className="field pr-24"
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-3 text-ink-muted">
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-base leading-none transition hover:bg-surface hover:text-ink"
                  >
                    ✕
                  </button>
                ) : null}
                {/* The magnifier and the spinner share the spot, so the search
                    reports work without anything on screen moving. */}
                {loading ? <span aria-hidden className="spinner" /> : <Magnifier />}
                <span className="sr-only" role="status">
                  {loading ? "Searching…" : ""}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div
                aria-busy={loading}
                className={`max-h-[58vh] overflow-auto transition-opacity duration-150 ${
                  loading ? "opacity-60" : "opacity-100"
                }`}
              >
                {genres.length ? (
                  <div>
                    <p className="label-mono">
                      Categories
                    </p>
                    <ul className="mt-3 divide-y divide-line border-y border-line">
                      {genres.map((genre) => (
                        <li key={genre.slug}>
                          <Link
                            href={`/library?genre=${genre.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-baseline justify-between gap-4 py-2.5 text-sm hover:text-ink"
                          >
                            <span className="font-medium text-ink">{genre.name}</span>
                            <span className="text-xs text-ink-muted">
                              {genre.books} book{genre.books === 1 ? "" : "s"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {books.length ? (
                  <div className={genres.length ? "mt-7" : ""}>
                    <p className="text-micro font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      Books
                    </p>
                    <ul className="mt-3 space-y-1">
                      {books.map((book, index) => (
                        <li key={book.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onFocus={() => setActive(index)}
                            onClick={() => go(book)}
                            className={`flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition ${
                              index === active ? "bg-surface" : "hover:bg-surface/60"
                            }`}
                          >
                            <BookCoverImage
                              url={book.cover_url}
                              title={book.title}
                              size="sm"
                              className="h-12 w-8 shrink-0 rounded border border-line"
                            />
                            <span className="min-w-0">
                              <span className="line-clamp-2 block text-sm font-medium leading-snug text-ink">
                                {book.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-ink-muted">
                                {book.authors?.name ?? "Unknown author"}
                                {book.genres?.name ? ` · ${book.genres.name}` : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {trimmed.length >= 2 && !loading && !books.length && !genres.length ? (
                  <p className="py-6 text-sm text-ink-muted">
                    Nothing matched “{trimmed}”. Try an author — or browse the whole library.
                  </p>
                ) : null}

                {trimmed.length >= 2 ? (
                  <Link
                    href={`/library?q=${encodeURIComponent(trimmed)}`}
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-block py-1 text-meta font-semibold uppercase tracking-[0.12em] text-ink underline decoration-ink/30 hover:decoration-ink"
                  >
                    See all{total > 0 ? ` ${total}` : ""} result{total === 1 ? "" : "s"}
                  </Link>
                ) : (
                  <p className="mt-6 text-sm text-ink-muted">
                    Start typing to see covers and matches — or pick a category above.
                  </p>
                )}
              </div>

              <aside className="hidden lg:block">
                {current ? (
                  <div className="rounded-card border border-line bg-white p-4">
                    <BookCoverImage
                      url={current.cover_url}
                      title={current.title}
                      author={current.authors?.name}
                      label={current.genres?.name}
                      className="mx-auto h-44 w-28 rounded-card border border-line"
                    />
                    <p className="mt-4 font-display text-base font-semibold leading-snug text-ink">
                      {current.title}
                    </p>
                    {meta ? <p className="mt-1 text-xs text-ink-muted">{meta}</p> : null}
                    {current.description ? (
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink-soft">
                        {current.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/library/${current.slug}`}
                        onClick={() => setOpen(false)}
                        className="btn btn-primary btn-sm"
                      >
                        View book
                      </Link>
                      {current.authors?.slug ? (
                        <Link
                          href={`/author/${current.authors.slug}`}
                          onClick={() => setOpen(false)}
                          className="btn btn-outline btn-sm"
                        >
                          More by them
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-card border border-dashed border-line p-6 text-center text-xs leading-relaxed text-ink-muted">
                    The book you are looking at appears here — cover, author, pages and a way in.
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
