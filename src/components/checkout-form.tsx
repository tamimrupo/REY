"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { BookCoverImage } from "@/components/book-cover";
import { Alert } from "@/components/ui";
import {
  addPickAction,
  removePickAction,
  startGuestCheckoutAction,
} from "@/lib/actions/storefront";
import { money } from "@/lib/format";
import { MAX_PICKS } from "@/lib/picks-shared";
import type { Address, Plan } from "@/lib/types";

export type CheckoutBook = {
  id: string;
  title: string;
  cover_url: string | null;
  author: string | null;
  genre: string | null;
  language: string | null;
};

export type CheckoutCourier = {
  key: string;
  label: string;
  charge: number;
  note: string;
};

/**
 * The guest checkout: the box cookie, plan choice, delivery address, account
 * creation and the first payment all in one submission. Books are added and
 * removed through server actions so the cookie and the screen cannot drift.
 */
export function CheckoutForm({
  initialPicks,
  books,
  plans,
  addresses,
  signedInEmail,
  hasHeldDeposit,
  couriers,
  defaultCourier,
  initialPlanSlug,
  initialName,
  initialPhone,
}: {
  initialPicks: CheckoutBook[];
  books: CheckoutBook[];
  plans: Plan[];
  addresses: Address[];
  signedInEmail: string | null;
  hasHeldDeposit: boolean;
  couriers: CheckoutCourier[];
  defaultCourier: string;
  initialPlanSlug: string | null;
  initialName: string;
  initialPhone: string;
}) {
  const [state, formAction, pending] = useActionState(startGuestCheckoutAction, null);

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => a.books_per_month - b.books_per_month),
    [plans],
  );

  const [picks, setPicks] = useState<CheckoutBook[]>(initialPicks);
  const [planSlug, setPlanSlug] = useState(() => {
    const requested = initialPlanSlug
      ? orderedPlans.find((plan) => plan.slug === initialPlanSlug)
      : null;
    if (requested) return requested.slug;

    const fits = orderedPlans.find((plan) => plan.books_per_month >= initialPicks.length);
    return (fits ?? orderedPlans[orderedPlans.length - 1])?.slug ?? "";
  });
  const [courier, setCourier] = useState(defaultCourier);
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    addresses.length ? "saved" : "new",
  );
  const [showPicker, setShowPicker] = useState(initialPicks.length === 0);
  const [query, setQuery] = useState("");
  const [pickerLimit, setPickerLimit] = useState(24);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const selectedPlan =
    orderedPlans.find((plan) => plan.slug === planSlug) ?? orderedPlans[0] ?? null;

  const fee = couriers.find((option) => option.key === courier)?.charge ?? 0;
  const deposit = hasHeldDeposit ? 0 : Number(selectedPlan?.security_deposit ?? 0);
  const total = Number(selectedPlan?.price_monthly ?? 0) + deposit + fee;
  const capacity = selectedPlan?.books_per_month ?? 0;
  const overCapacity = picks.length > capacity;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return books;
    return books.filter((book) =>
      [book.title, book.author, book.genre, book.language]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [books, query]);

  const visible = filtered.slice(0, pickerLimit);

  /** Keeps the selected plan big enough after a book is added. */
  const fitPlanTo = (count: number) => {
    setPlanSlug((currentSlug) => {
      const current = orderedPlans.find((plan) => plan.slug === currentSlug);
      if (current && count <= current.books_per_month) return currentSlug;
      const fits = orderedPlans.find((plan) => plan.books_per_month >= count);
      return fits?.slug ?? currentSlug;
    });
  };

  const add = async (book: CheckoutBook) => {
    if (picks.some((picked) => picked.id === book.id)) return;

    if (picks.length >= MAX_PICKS) {
      setPickError(`Your box holds up to ${MAX_PICKS} books.`);
      return;
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "AddToCart", {
        content_ids: [book.id],
        content_type: "product",
      });
    }

    setBusyId(book.id);
    const result = await addPickAction(book.id);
    setBusyId(null);

    if (!result?.ok) {
      setPickError(result?.message ?? "Could not add that book. Try again.");
      return;
    }

    setPickError(null);
    setPicks((current) => (current.some((picked) => picked.id === book.id) ? current : [...current, book]));
    fitPlanTo(picks.length + 1);
    window.dispatchEvent(new Event("rey:picks"));
  };

  const remove = async (book: CheckoutBook) => {
    setBusyId(book.id);
    const result = await removePickAction(book.id);
    setBusyId(null);

    if (!result?.ok) {
      setPickError(result?.message ?? "Could not remove that book. Try again.");
      return;
    }

    setPickError(null);
    setPicks((current) => current.filter((picked) => picked.id !== book.id));
    window.dispatchEvent(new Event("rey:picks"));
  };

  if (!selectedPlan) {
    return (
      <p className="border-t border-ink pt-6 text-ink-soft">
        No plans are published right now, so checkout is closed. Please try again shortly.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_400px]">
      {/* Honeypot: real customers never see or fill this. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      <div className="space-y-10">
        {/* ------------------------------------------------------- 1. Box */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-ink">1. Your box</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Pick up to {MAX_PICKS} titles. Your plan decides how many arrive each month.
              </p>
            </div>
            <span className="pill tone-progress">{picks.length} picked</span>
          </div>

          {picks.length ? (
            <ul className="mt-5 divide-y divide-line border-y border-ink">
              {picks.map((book) => (
                <li key={book.id} className="flex items-center gap-4 py-3">
                  <span className="h-16 w-11 shrink-0 overflow-hidden rounded-field border border-line bg-cream">
                    <BookCoverImage
                      url={book.cover_url}
                      title={book.title}
                      size="sm"
                      className="h-full w-full"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-sm font-medium text-ink">
                      {book.title}
                    </span>
                    {book.author ? (
                      <span className="block text-meta text-ink-muted">{book.author}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(book)}
                    disabled={busyId === book.id}
                    className="btn btn-ghost btn-sm"
                  >
                    {busyId === book.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 border-t border-ink pt-4 text-sm text-ink-muted">
              Your box is empty — pick your first titles below.
            </p>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowPicker((open) => !open)}
              aria-expanded={showPicker}
              aria-controls="book-picker"
              className="btn btn-outline btn-sm"
            >
              {showPicker ? "Hide the catalogue" : "Add more books"}
            </button>
          </div>

          {showPicker ? (
            <div id="book-picker" className="mt-5">
              <label className="sr-only" htmlFor="checkout-book-search">
                Search the catalogue
              </label>
              <input
                id="checkout-book-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPickerLimit(24);
                }}
                placeholder="Search by title, author or genre…"
                className="field"
              />
              <p className="mt-2 text-xs text-ink-muted">
                Showing {Math.min(visible.length, pickerLimit)} of {filtered.length} titles.{" "}
                <Link href="/library" className="underline hover:text-ink">
                  Browse the full library
                </Link>{" "}
                for more.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((book) => {
                  const picked = picks.some((entry) => entry.id === book.id);
                  const busy = busyId === book.id;
                  return (
                    <button
                      type="button"
                      key={book.id}
                      onClick={() => (picked ? remove(book) : add(book))}
                      disabled={busy}
                      aria-pressed={picked}
                      className={`overflow-hidden rounded-card border text-left transition ${
                        picked
                          ? "border-ink ring-2 ring-ink"
                          : "border-line hover:border-ink/40"
                      }`}
                    >
                      <span className="block aspect-[2/3] w-full overflow-hidden bg-cream">
                        <BookCoverImage
                          url={book.cover_url}
                          title={book.title}
                          label={book.genre}
                          className="h-full w-full"
                        />
                      </span>
                      <span className="block p-2.5">
                        <span className="line-clamp-2 text-xs font-medium leading-snug text-ink">
                          {book.title}
                        </span>
                        {book.author ? (
                          <span className="mt-1 line-clamp-1 block text-micro text-ink-muted">
                            {book.author}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {visible.length < filtered.length ? (
                <button
                  type="button"
                  onClick={() => setPickerLimit((limit) => limit + 24)}
                  className="btn btn-outline btn-sm mt-4"
                >
                  Show more titles
                </button>
              ) : null}

              {filtered.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  No titles matched “{query}”. Try a shorter search.
                </p>
              ) : null}
            </div>
          ) : null}

          {pickError ? (
            <p role="alert" className="mt-3 text-sm text-ink">
              {pickError}
            </p>
          ) : null}
        </section>

        {/* -------------------------------------------------- 2. Delivery */}
        <section>
          <h2 className="text-2xl font-semibold text-ink">2. Delivery</h2>

          {addresses.length ? (
            <div className="mt-4 space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer gap-3 rounded-card border border-line px-3 py-2 text-sm hover:bg-cream/60"
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

              <label className="flex cursor-pointer items-center gap-3 rounded-card border border-line px-3 py-2 text-sm hover:bg-cream/60">
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
                  <input
                    id="recipient"
                    name="recipient"
                    className="field"
                    required
                    defaultValue={initialName}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="phone">
                    Phone *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="field"
                    required
                    placeholder="01XXXXXXXXX"
                    defaultValue={initialPhone}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="street">
                  Street address *
                </label>
                <input
                  id="street"
                  name="street"
                  className="field"
                  required
                  autoComplete="street-address"
                />
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

          <div className="mt-6">
            <p className="label">Courier</p>
            <div className="mt-2 space-y-2">
              {couriers.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-center justify-between rounded-card border border-line px-3 py-2 text-sm hover:bg-cream/60"
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
        </section>

        {/* --------------------------------------------------- 3. Account */}
        <section>
          <h2 className="text-2xl font-semibold text-ink">3. Your account</h2>

          {signedInEmail ? (
            <p className="mt-2 text-sm text-ink-soft">
              Signed in as <span className="font-medium text-ink">{signedInEmail}</span>. We will
              attach this order to your membership.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                Your account is created when you place this order. You will use this email to
                track deliveries and renew.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="full_name">
                    Full name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    className="field"
                    required
                    defaultValue={initialName}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="field"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="password">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="field"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-xs text-ink-muted">At least 6 characters.</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                Already have an account?{" "}
                <Link href={`/login?next=${encodeURIComponent("/checkout")}`} className="underline hover:text-ink">
                  Sign in
                </Link>{" "}
                — your box will still be here.
              </p>
            </>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------- Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">Your plan</p>

          <div className="mt-4 space-y-2">
            {orderedPlans.map((plan) => {
              const fits = picks.length <= plan.books_per_month;
              return (
                <label
                  key={plan.slug}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-card border px-3 py-2 text-sm ${
                    planSlug === plan.slug ? "border-ink ring-1 ring-ink" : "border-line"
                  } ${fits ? "hover:bg-cream/60" : "opacity-50"}`}
                >
                  <span className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="plan"
                      value={plan.slug}
                      checked={planSlug === plan.slug}
                      onChange={() => setPlanSlug(plan.slug)}
                      disabled={!fits}
                    />
                    <span>
                      <span className="block font-medium text-ink">{plan.name}</span>
                      <span className="block text-xs text-ink-muted">
                        {plan.books_per_month} books / month · {money(plan.price_monthly)}
                      </span>
                    </span>
                  </span>
                  {fits ? null : <span className="text-micro text-ink-muted">Holds {plan.books_per_month}</span>}
                </label>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 border-t border-ink pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Plan (month 1)</span>
              <span className="text-ink">{money(selectedPlan.price_monthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Refundable deposit</span>
              <span className="text-ink">{deposit === 0 ? "Already held" : money(deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Delivery</span>
              <span className="text-ink">{fee === 0 ? "Free" : money(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-ink pt-3 font-display text-lg font-semibold">
              <span>First payment</span>
              <span>{money(total)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              The deposit is refunded when you leave and return your books. It is charged once.
            </p>
          </div>

          {state ? (
            <div className="mt-5">
              <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary mt-6 w-full"
            disabled={pending || picks.length === 0 || overCapacity}
          >
            {pending ? "Creating your order…" : `Place order · ${money(total)}`}
          </button>

          {picks.length === 0 ? (
            <p className="mt-2 text-center text-xs text-ink-muted">
              Pick at least one book to continue.
            </p>
          ) : null}

          {overCapacity ? (
            <p className="mt-2 text-center text-xs text-ink-muted">
              This plan holds {capacity} books — choose a bigger plan or remove{" "}
              {picks.length - capacity}.
            </p>
          ) : null}

          <p className="mt-4 text-xs text-ink-muted">
            After you order, pay by bKash/Nagad and paste the TrxID on the next page. We verify it
            and arrange delivery — usually 1–4 days.
          </p>
        </div>
      </aside>
    </form>
  );
}
