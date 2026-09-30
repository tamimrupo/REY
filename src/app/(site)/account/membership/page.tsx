import Link from "next/link";

import { CancelMembershipForm } from "@/components/account/profile-forms";
import { EmptyState, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCycles, getMySubscriptions } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Membership" };

export default async function MembershipPage() {
  const session = await requireUser("/account/membership");
  const subscriptions = await getMySubscriptions(session.userId);

  const current =
    subscriptions.find((s) => ["active", "paused", "pending"].includes(s.status)) ??
    subscriptions[0] ??
    null;

  const cycles = current ? await getCycles(current.id) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Membership</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your plan, billing dates, cycle history and cancellation.
        </p>
      </div>

      {!current ? (
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
                  {current.plans?.name ?? "Membership"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {current.plans?.books_per_month ?? "—"} books a month ·{" "}
                  {money(current.plans?.price_monthly ?? 0)}/month
                </p>
              </div>
              <StatusPill status={current.status} />
            </div>

            <dl className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-4">
              {[
                ["Started", formatDate(current.started_at)],
                ["Period ends", formatDate(current.current_period_end)],
                ["Next billing", formatDate(current.next_billing_date)],
                ["Deposit", money(current.plans?.security_deposit ?? 0)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">{label}</dt>
                  <dd className="mt-1 text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
              <Link href="/account/picks" className="btn btn-primary btn-sm">
                Pick this month&apos;s books
              </Link>
              <Link href="/plans" className="btn btn-outline btn-sm">
                Compare other plans
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Cycle history</h2>
            {cycles.length ? (
              <div className="mt-4 table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Period</th>
                      <th>Books</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((cycle) => (
                      <tr key={cycle.id}>
                        <td className="font-medium text-ink">#{cycle.cycle_number}</td>
                        <td className="text-ink-soft">
                          {formatDate(cycle.period_start)} — {formatDate(cycle.period_end)}
                        </td>
                        <td className="text-ink-soft">{cycle.cycle_picks?.length ?? 0}</td>
                        <td>
                          <StatusPill status={cycle.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No cycles yet.</p>
            )}
          </div>

          {current.status === "active" ? (
            <CancelMembershipForm
              subscriptionId={current.id}
              planName={current.plans?.name ?? "REY"}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
