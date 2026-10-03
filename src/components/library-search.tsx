"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The library's search bar.
 *
 * A form first: without JavaScript the button submits and the selects work, so
 * the page is fully usable. With JavaScript it stops asking people to press
 * Filter — the query searches itself 400ms after typing stops, the dropdowns
 * submit the moment they change, and the field gains a clear button. Every
 * change goes through the same GET form, so the URL stays shareable.
 */
export function LibrarySearch({
  q,
  genre,
  language,
  genres,
  languages,
}: {
  q: string;
  genre: string;
  language: string;
  genres: { id: string; slug: string; name: string }[];
  languages: string[];
}) {
  const [query, setQuery] = useState(q);
  const formRef = useRef<HTMLFormElement>(null);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current) return;
    const timer = setTimeout(() => formRef.current?.requestSubmit(), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const submitNow = () => formRef.current?.requestSubmit();

  return (
    <form
      ref={formRef}
      method="get"
      onSubmit={() => {
        typed.current = false;
      }}
      className="mt-8 flex flex-wrap items-stretch gap-2 border border-line bg-white p-2"
    >
      <div className="relative min-w-[14rem] flex-1">
        <label className="sr-only" htmlFor="q">
          Search title or author
        </label>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="q"
          name="q"
          value={query}
          autoComplete="off"
          placeholder="Search title or author…"
          className="field h-14 border-0 bg-transparent pl-11 pr-12 text-base"
          onChange={(event) => {
            typed.current = true;
            setQuery(event.target.value);
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              typed.current = true;
              setQuery("");
            }}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-field text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div>
        <label className="sr-only" htmlFor="genre">
          Genre
        </label>
        <select
          id="genre"
          name="genre"
          defaultValue={genre}
          onChange={submitNow}
          className="field h-14 w-auto border-0 bg-transparent"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="language">
          Language
        </label>
        <select
          id="language"
          name="language"
          defaultValue={language}
          onChange={submitNow}
          className="field h-14 w-auto border-0 bg-transparent"
        >
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary h-14 px-6">
        Filter
      </button>
    </form>
  );
}
