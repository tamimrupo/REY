"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusPill } from "@/components/ui";
import { daysLeft } from "@/lib/quotas";

type QuotaState = {
  subscription: { status: string; current_period_end: string | null } | null;
  plan: { name: string } | null;
  quota: number;
  remaining: number;
  out: unknown[];
  box: unknown[];
  isSwap: boolean;
  overdue: boolean;
};

/**
 * The sticky "how many books can I take" bar, resolved on the client so the
 * enclosing page can be statically cached. Anonymous visitors see nothing.
 */
export function QuotaBar() {
  const [state, setState] = useState<QuotaState | null>(null);

  useEffect(() => {
    fetch("/api/quota", { headers: { accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setState(d?.session ? d.state : null))
      .catch(() => setState(null));
  }, []);

  if (!state) return null;

  const left = daysLeft(state.subscription?.current_period_end ?? null);

  if (!state.subscription || !state.plan) {
    return (
      <div className="border-b border-line bg-cream">
        <div className="container-page flex flex-wrap items-center gap-3 py-3 text-sm">
          <span className="label-mono">Guest</span>
          <p className="text-ink-soft">
            <span className="font-medium text-ink">A plan unlocks 2, 4 or 8 books a month.</span>{" "}
            Start one from the header, or keep browsing — the library is open.
          </p>
        </div>
      </div>
    );
  }

  if (state.subscription.status !== "active") {
    return (
      <div className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <p className="text-ink">
            Your plan is <strong>{state.subscription.status}</strong>. Renew to keep picking books.
          </p>
          <Link href="/account/membership" className="btn btn-primary btn-sm">
            Manage plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-line bg-cream">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-ink">
            <span className="font-medium">{state.plan.name}</span>{" "}
            <span className="text-ink-muted">
              · you can choose {state.quota} books · {state.remaining} left
            </span>
          </span>

          {state.out.length ? (
            <span className="text-ink-muted">
              {state.out.length} book{state.out.length === 1 ? "" : "s"} with you
            </span>
          ) : null}

          {state.isSwap ? (
            <StatusPill status="processing" label="Swap trip" />
          ) : null}

          {state.overdue ? (
            <StatusPill status="cancelled" label="Overdue — return first" />
          ) : null}

          {left !== null && left <= 3 ? (
            <StatusPill
              status={left < 0 ? "cancelled" : "pending"}
              label={left < 0 ? "Plan ended" : `Renews in ${left} day${left === 1 ? "" : "s"}`}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {state.box.length ? (
            <span className="text-xs text-ink-muted">{state.box.length} in your box</span>
          ) : null}
          <Link href="/account/box" className="btn btn-primary btn-sm">
            {state.box.length ? `Review box (${state.box.length})` : "My box"}
          </Link>
        </div>
      </div>
    </div>
  );
}
