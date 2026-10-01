"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { CoverPlaceholder } from "@/components/book-cover";
import { Alert } from "@/components/ui";
import { importCandidatesAction } from "@/lib/actions/admin";
import { hasBengaliScript } from "@/lib/book-search";
import type { BookSearchRow } from "@/lib/book-search";

const MIN_QUERY = 3;

/** Human-readable facts about a result: author · year · pages · publisher. */
function metaLine(row: BookSearchRow): string {
  return [row.authors.join(", "), row.year, row.pages ? `${row.pages} pp` : null, row.publisher]
    .filter(Boolean)
    .join(" · ");
}

export function BookSearchImport() {
  const [state, importAction] = useActionState(importCandidatesAction, null);

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<BookSearchRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState("");
  /** The query the current rows belong to — drives the loading state. */
  const [loadedQuery, setLoadedQuery] = useState("");
  const [publish, setPublish] = useState(true);

  const trimmed = query.trim();
  const usable = trimmed.length >= MIN_QUERY;
  const settled = loadedQuery === trimmed;
  const searching = usable && !settled;

  // A finished import changes the message, which re-runs the search below so
  // the rows pick up their "In library" state.
  const refreshToken = state?.ok ? state.message : "";

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return;

    let cancelled = false;
    const controller = new AbortController();

    // Wait for a pause in typing before asking the metadata service.
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/book-search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          setError(payload.message ?? "The search failed.");
          setLoadedQuery(trimmed);
          return;
        }

        setError("");
        setRows((payload.results ?? []) as BookSearchRow[]);
        setTotal(typeof payload.totalFound === "number" ? payload.totalFound : null);
        setHint(payload.hint ?? null);
        setLoadedQuery(trimmed);
      } catch {
        if (cancelled) return;
        setError("Could not reach the book catalogue. Check your connection and retry.");
        setLoadedQuery(trimmed);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, refreshToken]);

  const missing = rows.filter((row) => !row.existing);
  const picks = missing.map((row) => ({ source: row.source, id: row.id }));
  const publishValue = publish ? "true" : "false";
  const showRows = usable && settled && rows.length > 0;
  const showEmpty = usable && settled && !rows.length && !error;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <label className="label" htmlFor="book-search">
            Search a title, author or ISBN
          </label>
          <input
            id="book-search"
            className="field"
            placeholder="The Alchemist · Humayun Ahmed · 9780141439518"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
          />
          Publish immediately
        </label>
      </div>

      <p className="text-xs text-ink-muted">
        Title, author, cover, description, pages and language are filled in automatically. Covers are
        copied into your own storage, so nothing breaks when the outside service goes down.
      </p>

      {searching ? <p className="text-sm text-ink-muted">Searching…</p> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {hint ? <Alert tone="warning">{hint}</Alert> : null}

      {showRows ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              {rows.length}
              {total ? ` of ${total.toLocaleString()}` : ""} match{rows.length === 1 ? "" : "es"} ·
              most wanted first
            </p>

            {picks.length ? (
              <form action={importAction}>
                <input type="hidden" name="picks" value={JSON.stringify(picks)} />
                <input type="hidden" name="publish" value={publishValue} />
                <SubmitButton className="btn btn-sm btn-outline" pendingLabel="Importing…">
                  Import all {picks.length}
                </SubmitButton>
              </form>
            ) : null}
          </div>

          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={`${row.source}-${row.id}`}
                className="flex gap-4 rounded-card border border-line bg-white p-3"
              >
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-card border border-line bg-surface">
                  <CoverPlaceholder title={row.title} size="sm" />
                  {row.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={row.coverUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        // Open Library wedges on some sizes; step down instead
                        // of showing a blank box.
                        const img = event.currentTarget;
                        const src = img.src;
                        if (src.endsWith("-L.jpg")) img.src = src.replace("-L.jpg", "-M.jpg");
                        else if (src.endsWith("-M.jpg")) img.src = src.replace("-M.jpg", "-S.jpg");
                        else img.style.visibility = "hidden";
                      }}
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink" title={row.title}>
                    {row.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{metaLine(row) || "Unknown author"}</p>
                  {row.description ? (
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-soft">{row.description}</p>
                  ) : null}
                  <p className="mt-1 text-micro text-ink-muted">
                    {row.isbn ? <span className="font-mono">ISBN {row.isbn}</span> : null}
                    {row.isbn && row.subjects.length ? " · " : null}
                    {row.subjects.length ? (
                      <span>{row.subjects.slice(0, 2).join(", ")}</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-start pt-1">
                  {row.existing ? (
                    <Link href={`/admin/books/${row.existing.id}`} className="btn btn-sm btn-outline">
                      In library
                    </Link>
                  ) : (
                    <form action={importAction}>
                      <input
                        type="hidden"
                        name="picks"
                        value={JSON.stringify([{ source: row.source, id: row.id }])}
                      />
                      <input type="hidden" name="publish" value={publishValue} />
                      <SubmitButton className="btn btn-sm btn-primary" pendingLabel="Saving…">
                        Import
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showEmpty ? (
        <Alert tone="info">No matches. Try a shorter title, just the author, or an ISBN.</Alert>
      ) : null}

      {/* A Bangla title the outside catalogues cannot see is still a book the
          shop can carry — hand it over to the manual form, Bangla intact. */}
      {showEmpty && query.trim().length >= 2 && hasBengaliScript(query) ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={`/admin/books/new?title=${encodeURIComponent(query.trim())}`}
            className="btn btn-outline btn-sm"
          >
            Add it by hand
          </Link>
          <span className="text-sm text-ink-muted">
            Keeps the Bangla exactly as you typed it.
          </span>
        </div>
      ) : null}

      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
    </div>
  );
}
