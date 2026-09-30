import Link from "next/link";

import { Alert, EmptyState, Stat, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  getActiveSubscription,
  getMyDeposits,
  getMyOrders,
  getSelectingCycle,
} from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage(props: PageProps<"/account">) {
  const session = await requireUser("/account");
  const search = await props.searchParams;

  const [subscription, orders, deposits] = await Promise.all([
    getActiveSubscription(session.userId),
    getMyOrders(session.userId),
    getMyDeposits(session.userId),
  ]);

  const cycle = subscription ? await getSelectingCycle(subscription.id) : null;
  const plan = subscription?.plans;
  const pendingPayment = orders.find((order) => order.status === "pending_payment");
  const heldDeposit = deposits
    .filter((deposit) => deposit.status === "held")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);

  return (
    <div className="space-y-8">
      {search.error === "not-admin" ? (
        <Alert tone="error">
          That area is for REY staff. If you think you should have access, ask an admin to set your
          role.
        </Alert>
      ) : null}

      <div>
        <h1 className="text-3xl font-semibold text-ink">
          Hello {session.profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Everything about your membership, boxes and deliveries in one place.
        </p>
      </div>

      {pendingPayment ? (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Order {pendingPayment.order_number} needs payment.</p>
              <p className="mt-1">
                Finish checkout to activate your membership and queue your first delivery.
              </p>
            </div>
            <Link href={`/checkout/${pendingPayment.id}`} className="btn btn-primary btn-sm">
              Complete checkout
            </Link>
          </div>
        </Alert>
      ) : null}

      {subscription && plan ? (
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Your membership</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{plan.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {plan.books_per_month} books a month · {money(plan.price_monthly)}/month
              </p>
            </div>
            <StatusPill status={subscription.status} />
          </div>

          <dl className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">Next billing</dt>
              <dd className="mt-1 text-ink">{formatDate(subscription.next_billing_date)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">Period ends</dt>
              <dd className="mt-1 text-ink">{formatDate(subscription.current_period_end)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.08em] text-ink-muted">This month</dt>
              <dd className="mt-1 text-ink">
                {cycle
                  ? `${cycle.cycle_picks?.length ?? 0} of ${plan.books_per_month} picked`
                  : "All set"}
              </dd>
            </div>
          </dl>

          {cycle ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Time to pick your books</p>
              <p className="mt-1">
                Choose {plan.books_per_month} titles for cycle #{cycle.cycle_number}.
              </p>
              <Link href="/account/picks" className="btn btn-primary btn-sm mt-3">
                Pick my books
              </Link>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
            <Link href="/account/membership" className="btn btn-outline btn-sm">
              Manage membership
            </Link>
            <Link href="/library" className="btn btn-outline btn-sm">
              Browse the library
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          title="You are not subscribed yet"
          description="Pick a plan and choose your first box — it takes about two minutes."
          actionHref="/plans"
          actionLabel="See the plans"
        />
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Stat label="Refundable deposit held" value={money(heldDeposit)} />
        <Stat label="Orders" value={orders.length} />
        <Stat
          label="Books borrowed all-time"
          value={orders.reduce(
            (sum, order) => sum + (order.order_items?.filter((item) => item.book_id).length ?? 0),
            0,
          )}
        />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
          <Link href="/account/orders" className="text-sm text-ink-soft hover:text-gold">
            View all
          </Link>
        </div>

        {orders.length ? (
          <ul className="mt-4 divide-y divide-line">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{order.order_number}</p>
                  <p className="text-xs text-ink-muted">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink">{money(order.total)}</span>
                  <StatusPill status={order.status} />
                  {order.status === "pending_payment" ? (
                    <Link href={`/checkout/${order.id}`} className="btn btn-primary btn-sm">
                      Pay
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
