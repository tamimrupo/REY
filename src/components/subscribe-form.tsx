"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import { BookCoverImage } from "@/components/book-cover";
import { Alert } from "@/components/ui";
import { startSubscriptionAction } from "@/lib/actions/storefront";
import { money } from "@/lib/format";
import type { Address, Plan } from "@/lib/types";

export type PickBook = {
  id: string;
  title: string;
  cover_url: string | null;
  author: string | null;
  genre: string | null;
  language: string | null;
};

export type CourierOption = {
  key: string;
  label: string;
  charge: number;
  note: string;
};

export function SubscribeForm({
  plan,
  books,
  addresses,
  couriers,
  defaultCourier,
}: {
  plan: Plan;
  books: PickBook[];
  addresses: Address[];
  couriers: CourierOption[];
  defaultCourier: string;
}) {
  const [state, formAction, pending] = useActionState(startSubscriptionAction, null);

  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [courier, setCourier] = useState(defaultCourier);
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    addresses.length ? "saved" : "new",
  );

  const limit = plan.books_per_month;
  const fee = couriers.find((c) => c.key === courier)?.charge ?? 0;
  const deposit = plan.security_deposit;
  const total = Number(plan.price_monthly) + Number(deposit) + fee;
  const isFull = selected.length === limit;

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

  const selectedBooks = selected
    .map((id) => books.find((book) => book.id === id))
    .filter(Boolean) as PickBook[];

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="plan" value={plan.slug} />

      {/* ------------------------------------------------------- Book picker */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">1. Pick your books</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Choose {limit} title{limit === 1 ? "" : "s"} for your first box.
            </p>
          </div>
          <span
            className={`pill ${
              isFull ? "tone-good" : "tone-progress"
            }`}
          >
            {selected.length} / {limit} selected
          </span>
        </div>

        <div className="mt-5">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this selection by title, author or genre…"
            className="field"
          />
          <p className="mt-2 text-xs text-ink-muted">
            Showing {filtered.length} of {books.length} titles.{" "}
            <Link href="/library" className="underline hover:text-ink">
              Browse the full library
            </Link>{" "}
            to find more.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((book) => {
            const active = selected.includes(book.id);
            const maxed = !active && selected.length >= limit;
            return (
              <button
                type="button"
                key={book.id}
                onClick={() => toggle(book.id)}
                aria-pressed={active}
                className={`group overflow-hidden rounded-xl border text-left transition ${
                  active
                    ? "border-ink ring-2 ring-ink"
                    : maxed
                      ? "border-line opacity-45"
                      : "border-line hover:border-ink/40"
                }`}
              >
                <div className="aspect-[2/3] w-full overflow-hidden bg-cream">
                  <BookCoverImage
                    url={book.cover_url}
                    title={book.title}
                    label={book.genre}
                    className="h-full w-full"
                  />
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

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">
            No titles matched “{query}”. Try a shorter search.
          </p>
        ) : null}

        {/* Hidden inputs carry the selection to the server action. */}
        {selected.map((id) => (
          <input key={id} type="hidden" name="books" value={id} />
        ))}
      </div>

      {/* ---------------------------------------------------------- Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">Your plan</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{plan.name}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {limit} book{limit === 1 ? "" : "s"} a month
          </p>

          <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            {selectedBooks.length ? (
              <ul className="space-y-1.5">
                {selectedBooks.map((book) => (
                  <li key={book.id} className="flex items-start justify-between gap-3">
                    <span className="line-clamp-1 text-ink-soft">{book.title}</span>
                    <button
                      type="button"
                      onClick={() => toggle(book.id)}
                      className="text-xs text-ink-muted hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted">No books selected yet.</p>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Plan (month 1)</span>
              <span className="text-ink">{money(plan.price_monthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Security deposit</span>
              <span className="text-ink">{money(deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Delivery</span>
              <span className="text-ink">{fee === 0 ? "Free" : money(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-semibold">
              <span>First payment</span>
              <span>{money(total)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              The {money(deposit)} deposit is refundable when you leave and return your books. It is
              only charged once.
            </p>
          </div>

          {/* --------------------------------------------------- Delivery */}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-lg font-semibold text-ink">2. Delivery</h3>
            <div className="mt-3 space-y-2">
              {couriers.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2 text-sm hover:bg-cream/60"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="courier"
                      value={option.key}
                      checked={courier === option.key}
                      onChange={() => setCourier(option.key)}
                    />
                    <span className="text-ink">{option.label}</span>
                  </span>
                  <span className="text-xs text-ink-muted">
                    {option.charge === 0 ? "Free" : money(option.charge)}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              We cover part of the courier cost — you only pay your share.
            </p>
          </div>

          {/* ---------------------------------------------------- Address */}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-lg font-semibold text-ink">3. Where should we deliver?</h3>

            {addresses.length ? (
              <div className="mt-3 space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer gap-3 rounded-lg border border-line px-3 py-2 text-sm hover:bg-cream/60"
                  >
                    <input
                      type="radio"
                      name="address_id"
                      value={address.id}
                      checked={addressMode === "saved"}
                      onChange={() => setAddressMode("saved")}
                    />
                    <span>
                      <span className="block font-medium text-ink">
                        {address.label} · {address.recipient}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {address.street}, {address.area} {address.city}
                      </span>
                    </span>
                  </label>
                ))}

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm hover:bg-cream/60">
                  <input
                    type="radio"
                    name="address_id"
                    value=""
                    checked={addressMode === "new"}
                    onChange={() => setAddressMode("new")}
                  />
                  <span className="text-ink">Use a new address</span>
                </label>
              </div>
            ) : (
              <input type="hidden" name="address_id" value="" />
            )}

            {addressMode === "new" ? (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="recipient">
                      Recipient *
                    </label>
                    <input id="recipient" name="recipient" className="field" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">
                      Phone *
                    </label>
                    <input id="phone" name="phone" className="field" required placeholder="01XXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="street">
                    Street address *
                  </label>
                  <input id="street" name="street" className="field" required />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="area">
                      Area
                    </label>
                    <input id="area" name="area" className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor="city">
                      City
                    </label>
                    <input id="city" name="city" className="field" defaultValue="Dhaka" />
                  </div>
                  <div>
                    <label className="label" htmlFor="division">
                      Division
                    </label>
                    <input id="division" name="division" className="field" defaultValue="Dhaka" />
                  </div>
                </div>
                <input type="hidden" name="label" value="Home" />
                <input type="hidden" name="is_default" value="on" />
              </div>
            ) : null}
          </div>

          {state ? (
            <div className="mt-5">
              <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
            </div>
          ) : null}

          <div className="mt-6">
            <button type="submit" className="btn btn-primary w-full" disabled={!isFull || pending}>
              {pending ? "Creating your order…" : `Continue · ${money(total)}`}
            </button>
            {!isFull ? (
              <p className="mt-2 text-center text-xs text-ink-muted">
                Select {limit - selected.length} more to continue.
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </form>
  );
}
