"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { ActionForm } from "@/components/forms/action-form";
import { BookCoverImage } from "@/components/book-cover";
import { Alert, StatusPill } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  confirmBoxAction,
  createRenewalOrderAction,
  removeFromBoxAction,
  requestDepositRefundAction,
  requestReturnAction,
  saveCourierPreferenceAction,
} from "@/lib/actions/storefront";
import { money } from "@/lib/format";
import type { Address, Rental } from "@/lib/types";

export type CourierOption = { key: string; label: string; charge: number; note?: string };

function BookLine({ rental }: { rental: Rental }) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-line bg-cream">
        <BookCoverImage
          url={rental.books?.cover_url}
          title={rental.books?.title ?? "Book"}
          size="sm"
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{rental.books?.title ?? "Book"}</p>
        <p className="text-xs text-ink-muted">
          {rental.books?.authors?.name ?? "—"}
          {rental.due_at ? ` · due ${new Date(rental.due_at).toLocaleDateString("en-GB")}` : ""}
        </p>
      </div>
      <StatusPill status={rental.status} />
      {/* A button with formAction, not a nested <form>: nesting forms is invalid HTML
          and breaks hydration. The button's own name/value carries the rental id. */}
      <button
        type="submit"
        name="rental_id"
        value={rental.id}
        formAction={removeFromBoxAction}
        className="btn btn-ghost btn-sm text-rose-600"
      >
        Remove
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm the box — trip type, courier, address                               */
/* -------------------------------------------------------------------------- */

export function ConfirmBoxPanel({
  box,
  couriers,
  addresses,
  isSwap,
  defaultCourier,
  outCount,
}: {
  box: Rental[];
  couriers: CourierOption[];
  addresses: Address[];
  isSwap: boolean;
  defaultCourier: string;
  outCount: number;
}) {
  const [state, formAction, pending] = useActionState(confirmBoxAction, null);
  const [courier, setCourier] = useState(defaultCourier);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");

  const fee = couriers.find((option) => option.key === courier)?.charge ?? 0;

  return (
    <form action={formAction} className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Confirm this box</h2>
        <StatusPill
          status={isSwap ? "processing" : "pending"}
          label={isSwap ? "Swap trip" : "First delivery"}
        />
      </div>

      {isSwap ? (
        <p className="mt-3 rounded-card bg-cream/70 p-3 text-sm text-ink-soft">
          You still have <strong>{outCount}</strong> book{outCount === 1 ? "" : "s"} from last month.
          We collect them on the same trip as your new books — one courier charge instead of two.
        </p>
      ) : null}

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {box.map((rental) => (
          <BookLine key={rental.id} rental={rental} />
        ))}
      </ul>

      <div className="mt-5 space-y-4">
        <div>
          <span className="label">Courier</span>
          <div className="space-y-2">
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
        </div>

        {addresses.length ? (
          <div>
            <label className="label" htmlFor="address_id">
              Deliver to
            </label>
            <select
              id="address_id"
              name="address_id"
              className="field"
              value={addressId}
              onChange={(event) => setAddressId(event.target.value)}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} · {address.recipient}, {address.street}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Alert tone="warning">
            Add a delivery address first.{" "}
            <Link href="/account/addresses" className="underline">
              Add address
            </Link>
          </Alert>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="text-sm">
          <p className="text-ink-muted">Courier charge for this trip</p>
          <p className="font-display text-xl font-semibold text-ink">
            {fee === 0 ? "Free" : money(fee)}
          </p>
        </div>
        <SubmitButton pendingLabel="Confirming…">Confirm my books</SubmitButton>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Books are free — you only ever pay the plan, the refundable deposit and your share of the
        courier.
      </p>

      {state ? (
        <div className="mt-4">
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        </div>
      ) : null}
      {pending ? <p className="mt-2 text-xs text-ink-muted">Working…</p> : null}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Returns                                                                     */
/* -------------------------------------------------------------------------- */

export function ReturnForm({
  couriers,
  addresses,
  bdpostRules,
  warehouse,
  outCount,
}: {
  couriers: CourierOption[];
  addresses: Address[];
  bdpostRules: string;
  warehouse: { name: string; phone: string; address: string };
  outCount: number;
}) {
  const [state, formAction] = useActionState(requestReturnAction, null);
  const [courier, setCourier] = useState(couriers[0]?.key ?? "steadfast");
  const fee = couriers.find((option) => option.key === courier)?.charge ?? 0;

  return (
    <form action={formAction} className="card p-6">
      <h2 className="text-lg font-semibold text-ink">Send {outCount === 1 ? "it" : "them"} back</h2>
      <p className="mt-1 text-sm text-ink-soft">
        We will arrange a pickup, or you can post them yourself with BD Post.
      </p>

      <div className="mt-5 space-y-3">
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

      {courier === "bdpost" ? (
        <div className="mt-5 space-y-3 rounded-card border border-line bg-cream/50 p-4">
          <p className="whitespace-pre-line text-xs leading-relaxed text-ink-soft">{bdpostRules}</p>
          <div className="rounded-card bg-white p-3 text-xs text-ink-soft">
            <p className="font-semibold text-ink">Return address</p>
            <p className="mt-1">
              {warehouse.name}
              <br />
              {warehouse.address}
              <br />
              {warehouse.phone}
            </p>
          </div>
          <div>
            <label className="label" htmlFor="bdpost_receipt">
              Post office receipt number
            </label>
            <input
              id="bdpost_receipt"
              name="bdpost_receipt"
              className="field"
              placeholder="e.g. 12345"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="bdpost_agree" className="mt-0.5" />
            I have read and followed the Book Packet rules.
          </label>
        </div>
      ) : null}

      {addresses.length ? (
        <input type="hidden" name="address_id" value={addresses[0]?.id ?? ""} />
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm text-ink-muted">Pickup charge: {fee === 0 ? "Free" : money(fee)}</p>
        <SubmitButton pendingLabel="Submitting…">Request pickup</SubmitButton>
      </div>

      {state ? (
        <div className="mt-4">
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        </div>
      ) : null}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Membership controls                                                         */
/* -------------------------------------------------------------------------- */

export function DepositRefundForm({ eligible }: { eligible: boolean }) {
  return (
    <ActionForm
      action={requestDepositRefundAction}
      submitLabel="Request deposit refund"
      pendingLabel="Submitting…"
      submitClassName="btn btn-outline"
    >
      <p className="text-sm text-ink-soft">
        {eligible
          ? "All books are back, so your refundable deposit can be returned to your bKash/Nagad number within 7 working days."
          : "Return every book first — then you can ask for the deposit back."}
      </p>
      {eligible ? (
        <div>
          <label className="label" htmlFor="deposit_note">
            Where should we send it? (optional)
          </label>
          <input id="deposit_note" name="note" className="field" placeholder="bKash 017XXXXXXXX" />
        </div>
      ) : null}
    </ActionForm>
  );
}

export function CouriersPreferenceForm({
  couriers,
  current,
}: {
  couriers: CourierOption[];
  current: string;
}) {
  return (
    <ActionForm
      action={saveCourierPreferenceAction}
      submitLabel="Save preference"
      pendingLabel="Saving…"
      submitClassName="btn btn-outline"
    >
      <div>
        <label className="label" htmlFor="pref_courier">
          Preferred courier for future sends
        </label>
        <select id="pref_courier" name="courier" className="field" defaultValue={current}>
          {couriers.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} {option.charge === 0 ? "· Free" : `· ${money(option.charge)}`}
            </option>
          ))}
        </select>
      </div>
    </ActionForm>
  );
}

/** Renewal: creates an order for the next month, then sends the customer to checkout. */
export function RenewForm({
  couriers,
  current,
  price,
}: {
  couriers: CourierOption[];
  current: string;
  price: number;
}) {
  const [state, formAction, pending] = useActionState(createRenewalOrderAction, null);
  const [courier, setCourier] = useState(current);
  const fee = couriers.find((option) => option.key === courier)?.charge ?? 0;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="renew_courier">
          Courier for the next month
        </label>
        <select
          id="renew_courier"
          name="courier"
          className="field"
          value={courier}
          onChange={(event) => setCourier(event.target.value)}
        >
          {couriers.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} {option.charge === 0 ? "· Free" : `· ${money(option.charge)}`}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-ink-soft">
        {money(price)} plan + {fee === 0 ? "free delivery" : `${money(fee)} delivery`} ={" "}
        <span className="font-semibold text-ink">{money(price + fee)}</span>
      </p>

      <SubmitButton className="btn btn-primary" pendingLabel="Creating order…">
        Renew for another month
      </SubmitButton>

      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      {pending ? <p className="text-xs text-ink-muted">Working…</p> : null}
    </form>
  );
}
