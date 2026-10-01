import Link from "next/link";

import { StatusPill } from "@/components/ui";
import { getMembershipState } from "@/lib/data";
import { daysLeft } from "@/lib/quotas";

/**
 * The sticky "how many books can I take" bar from the WordPress plugin,
 * rebuilt as a server component so it always shows live numbers.
 */
export async function QuotaBar({ userId }: { userId: string }) {
  const state = await getMembershipState(userId);
  const left = daysLeft(state.subscription?.current_period_end);

  if (!state.subscription || !state.plan) {
    return (
      <div className="border-b border-line bg-cream/70">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <p className="text-ink-soft">
            <span className="font-medium text-ink">Browsing as a guest.</span> A plan unlocks 2, 4 or
            8 books a month.
          </p>
          <Link href="/plans" className="btn btn-primary btn-sm">
            Get a plan
          </Link>
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
    <div className="border-b border-line bg-cream/70">
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
