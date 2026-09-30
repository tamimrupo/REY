"use client";

import { useActionState, useMemo, useState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { savePicksAction } from "@/lib/actions/storefront";
import type { PickBook } from "@/components/subscribe-form";

export function PickBooksForm({
  cycleId,
  limit,
  books,
  currentPicks,
}: {
  cycleId: string;
  limit: number;
  books: PickBook[];
  currentPicks: string[];
}) {
  const [state, formAction] = useActionState(savePicksAction, null);
  const [selected, setSelected] = useState<string[]>(currentPicks);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return books;
    return books.filter((book) =>
      [book.title, book.author, book.genre, book.language]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [books, query]);

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= limit) return current;
      return [...current, id];
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="cycle_id" value={cycleId} />
      <input type="hidden" name="limit" value={limit} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="books" value={id} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles…"
          className="field sm:max-w-sm"
        />
        <span
          className={`pill ${
            selected.length === limit ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {selected.length} / {limit} selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {filtered.map((book) => {
          const active = selected.includes(book.id);
          const maxed = !active && selected.length >= limit;
          return (
            <button
              type="button"
              key={book.id}
              onClick={() => toggle(book.id)}
              aria-pressed={active}
              className={`overflow-hidden rounded-xl border text-left transition ${
                active
                  ? "border-ink ring-2 ring-ink"
                  : maxed
                    ? "border-line opacity-45"
                    : "border-line hover:border-ink/40"
              }`}
            >
              <div className="aspect-[2/3] w-full overflow-hidden bg-cream">
                {book.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between p-3">
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted">
                      {book.genre ?? "REY"}
                    </span>
                    <span className="font-display text-xs font-semibold leading-snug text-ink">
                      {book.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-ink">
                  {book.title}
                </p>
                {book.author ? (
                  <p className="mt-1 text-[0.65rem] text-ink-muted">{book.author}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <SubmitButton pendingLabel="Saving…">Save my picks</SubmitButton>
    </form>
  );
}
