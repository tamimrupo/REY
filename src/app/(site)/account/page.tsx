import Link from "next/link";

import { Alert, EmptyState, Stat, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getMembershipState, getMyDeposits, getMyOrders } from "@/lib/data";
import { daysLeft, rentalStatusLabel } from "@/lib/quotas";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "My account" };

export default async function AccountOverviewPage(props: PageProps<"/account">) {
  const session = await requireUser("/account");
  const search = await props.searchParams;

  const [state, orders, deposits] = await Promise.all([
    getMembershipState(session.userId),
    getMyOrders(session.userId),
    getMyDeposits(session.userId),
  ]);

  const plan = state.plan;
  const subscription = state.subscription;
  const pendingPayment = orders.find((order) => order.status === "pending_payment");
  const heldDeposit = deposits
    .filter((deposit) => deposit.status === "held")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const left = daysLeft(subscription?.current_period_end);
  const booksBorrowed = orders.reduce(
    (sum, order) => sum + (order.order_items?.filter((item) => item.book_id).length ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      {search.error === "not-admin" ? (
        <Alert tone="error">
          That area is for REY staff. If you think you should have access, ask an admin to set your
          role.
        </Alert>
      ) : null}

      <div>
        <h1 className="text-ink">
          Hello {session.profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your membership, boxes, books and deliveries in one place.
        </p>
      </div>

      {pendingPayment ? (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Order {pendingPayment.order_number} needs payment.</p>
              <p className="mt-1">
                Finish checkout to activate your membership and queue your delivery.
              </p>
            </div>
            <Link href={`/checkout/${pendingPayment.id}`} className="btn btn-primary btn-sm">
              Complete checkout
            </Link>
          </div>
        </Alert>
      ) : null}

      {state.overdue ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">
              You have overdue books. Return them to keep picking new titles.
            </p>
            <Link href="/account/books" className="btn btn-outline btn-sm">
              Return books
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

          <dl className="mt-6 grid gap-6 border-t border-ink pt-6 sm:grid-cols-4">
            <div>
              <dt className="label-mono">Period ends</dt>
              <dd className="mt-1 text-ink">{formatDate(subscription.current_period_end)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">Slots used</dt>
              <dd className="mt-1 text-ink">
                {state.used} of {state.quota} · {state.remaining} left
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">Books with you</dt>
              <dd className="mt-1 text-ink">{state.out.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">In your box</dt>
              <dd className="mt-1 text-ink">{state.box.length}</dd>
            </div>
          </dl>

          {state.box.length ? (
            <div className="mt-6 rounded-card border border-ink bg-surface p-4 text-sm text-ink">
              <p className="font-semibold">
                {state.box.length} book{state.box.length === 1 ? "" : "s"} waiting in your box
              </p>
              <p className="mt-1">
                {state.remaining > 0
                  ? `${state.remaining} slot${state.remaining === 1 ? "" : "s"} still free this month.`
                  : "Your box is full — confirm it and we will dispatch."}
              </p>
              <Link href="/account/box" className="btn btn-primary btn-sm mt-3">
                Review my box
              </Link>
            </div>
          ) : null}

          {left !== null && left <= 3 ? (
            <div className="mt-6 rounded-card border border-line bg-cream/60 p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">
                {left < 0
                  ? `Your plan ended on ${formatDate(subscription.current_period_end)}.`
                  : `Your plan renews in ${left} day${left === 1 ? "" : "s"}.`}
              </p>
              <p className="mt-1">Renew to keep your books out and keep picking.</p>
              <Link href="/account/membership" className="btn btn-outline btn-sm mt-3">
                Renew membership
              </Link>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-ink pt-6">
            <Link href="/account/box" className="btn btn-primary btn-sm">
              Pick this month&apos;s books
            </Link>
            <Link href="/account/books" className="btn btn-outline btn-sm">
              My books
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
        <Stat label="Refundable deposit held" value={money(heldDeposit)} />
        <Stat label="Books with you" value={state.out.length} />
        <Stat label="Books borrowed all-time" value={booksBorrowed} />
      </div>

      {state.rentals.length ? (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Currently on loan</h2>
            <Link href="/account/books" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-ink">
              Manage returns
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {[...state.box, ...state.out].slice(0, 6).map((rental) => (
              <li key={rental.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{rental.books?.title ?? "Book"}</p>
                  <p className="text-xs text-ink-muted">
                    {rental.due_at ? `Due ${formatDate(rental.due_at)}` : "—"}
                  </p>
                </div>
                <StatusPill status={rental.status} label={rentalStatusLabel(rental.status)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-ink">
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
