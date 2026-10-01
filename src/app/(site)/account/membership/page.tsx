import Link from "next/link";

import { CancelMembershipForm } from "@/components/account/profile-forms";
import {
  CouriersPreferenceForm,
  DepositRefundForm,
  RenewForm,
  type CourierOption,
} from "@/components/account/box-forms";
import { EmptyState, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCourierSettings, getMembershipState, getMyDeposits, getMySubscriptions } from "@/lib/data";
import { couriersFor, daysLeft } from "@/lib/quotas";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Membership" };

export default async function MembershipPage() {
  const session = await requireUser("/account/membership");

  const [state, subscriptions, deposits, courierSettings] = await Promise.all([
    getMembershipState(session.userId),
    getMySubscriptions(session.userId),
    getMyDeposits(session.userId),
    getCourierSettings(),
  ]);

  const current = state.subscription ?? subscriptions[0] ?? null;
  const couriers: CourierOption[] = couriersFor(courierSettings, "outbound");
  const heldDeposit = deposits.find((deposit) => deposit.status === "held") ?? null;
  const openRentals = state.rentals.filter((rental) =>
    ["pending", "out", "returning"].includes(rental.status),
  ).length;
  const left = daysLeft(current?.current_period_end);
  const preferred = session.profile?.courier_preference ?? courierSettings.methods[0]?.key ?? "steadfast";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink">Membership</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your plan, billing dates, courier preference and deposit.
        </p>
      </div>

      {!current || !current.plans ? (
        <EmptyState
          title="No membership found"
          description="Choose a plan to start borrowing."
          actionHref="/plans"
          actionLabel="See the plans"
        />
      ) : (
        <>
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Current plan</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  {current.plans.name}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {current.plans.books_per_month} books a month ·{" "}
                  {money(current.plans.price_monthly)}/month
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={current.status} />
                {left !== null && left <= 3 ? (
                  <StatusPill
                    status={left < 0 ? "cancelled" : "pending"}
                    label={left < 0 ? "Ended" : `${left} day${left === 1 ? "" : "s"} left`}
                  />
                ) : null}
              </div>
            </div>

            <dl className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-4">
              <div>
                <dt className="label-mono">Started</dt>
                <dd className="mt-1 text-ink">{formatDate(current.started_at ?? current.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">Period ends</dt>
                <dd className="mt-1 text-ink">{formatDate(current.current_period_end)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">Next billing</dt>
                <dd className="mt-1 text-ink">{formatDate(current.next_billing_date)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">Deposit</dt>
                <dd className="mt-1 text-ink">
                  {heldDeposit
                    ? money(heldDeposit.amount)
                    : money(current.plans.security_deposit)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div className="rounded-card bg-cream/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Slots this month</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">
                  {state.used} / {state.quota}
                </p>
              </div>
              <div className="rounded-card bg-cream/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Books with you</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">{state.out.length}</p>
              </div>
              <div className="rounded-card bg-cream/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">In your box</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">{state.box.length}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
              <Link href="/account/box" className="btn btn-primary btn-sm">
                Pick this month&apos;s books
              </Link>
              <Link href="/plans" className="btn btn-outline btn-sm">
                Compare other plans
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Renew for another month</h2>
              <p className="mt-1 mb-5 text-sm text-ink-soft">
                Renewing adds {current.plans.books_per_month} fresh book slots and extends your due
                dates by 30 days. Books you already have stay with you.
              </p>
              <RenewForm
                couriers={couriers}
                current={preferred}
                price={Number(current.plans.price_monthly)}
              />
            </section>

            <section className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Delivery preference</h2>
              <p className="mt-1 mb-5 text-sm text-ink-soft">
                Used for swaps and new sends. You can still pick a different courier each time you
                confirm a box.
              </p>
              <CouriersPreferenceForm couriers={couriers} current={preferred} />
            </section>
          </div>

          <section className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Security deposit</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  One-time, refundable.{" "}
                  {heldDeposit
                    ? heldDeposit.refund_requested_at
                      ? "Your refund has been requested and is being processed."
                      : "Currently held for you."
                    : "Not charged on your account."}
                </p>
              </div>
              {heldDeposit ? <StatusPill status={heldDeposit.status} /> : null}
            </div>

            {heldDeposit && !heldDeposit.refund_requested_at ? (
              <div className="mt-5 border-t border-line pt-5">
                <DepositRefundForm eligible={openRentals === 0} />
              </div>
            ) : null}

            {deposits.length ? (
              <ul className="mt-5 divide-y divide-line border-t border-line pt-2 text-sm">
                {deposits.map((deposit) => (
                  <li key={deposit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-ink">{money(deposit.amount)}</p>
                      <p className="text-xs text-ink-muted">
                        Since {formatDate(deposit.created_at)}
                        {deposit.refunded_at ? ` · refunded ${formatDate(deposit.refunded_at)}` : ""}
                      </p>
                    </div>
                    <StatusPill status={deposit.status} />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {current.status === "active" ? (
            <CancelMembershipForm
              subscriptionId={current.id}
              planName={current.plans.name}
            />
          ) : null}
        </>
      )}

      {subscriptions.length > 1 ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Subscription history</h2>
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="text-ink">{subscription.plans?.name ?? "Plan"}</td>
                    <td className="text-ink-soft">
                      {formatDate(subscription.started_at ?? subscription.created_at)}
                    </td>
                    <td className="text-ink-soft">{formatDate(subscription.current_period_end)}</td>
                    <td>
                      <StatusPill status={subscription.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
