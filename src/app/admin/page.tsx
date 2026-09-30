import Link from "next/link";

import { Stat, StatusPill } from "@/components/ui";
import {
  getDashboardStats,
  getRecentOrders,
  listPayments,
  listRareRequests,
  listSubscriptions,
} from "@/lib/data";
import { formatDate, humanize, money } from "@/lib/format";

export default async function AdminOverviewPage() {
  const [stats, recentOrders, pendingPayments, pendingSubs, requests] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(6),
    listPayments("pending"),
    listSubscriptions("pending"),
    listRareRequests("pending"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Overview</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Everything that needs a human, in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/books/new" className="btn btn-primary btn-sm">
            Add a book
          </Link>
          <Link href="/admin/payments" className="btn btn-outline btn-sm">
            Review payments
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly recurring" value={money(stats.mrr)} hint="From active subscriptions" />
        <Stat
          label="Active members"
          value={stats.active_subscriptions}
          hint={`${stats.pending_subscriptions} awaiting activation`}
        />
        <Stat label="Customers" value={stats.customers} hint="Accounts on the site" />
        <Stat
          label="Pending payments"
          value={stats.pending_payments}
          hint="Submitted, not yet verified"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Titles live" value={stats.titles} />
        <Stat label="Deposits held" value={money(stats.held_deposits)} hint="Refundable on exit" />
        <Stat label="Open requests" value={stats.open_requests} hint="Rare book requests" />
        <Stat
          label="Deposits to refund"
          value={money(0)}
          hint="Mark refunds under Deposits"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Payments to verify</h2>
            <Link href="/admin/payments" className="text-sm text-ink-soft hover:text-gold">
              View all
            </Link>
          </div>

          {pendingPayments.length ? (
            <ul className="mt-4 divide-y divide-line">
              {pendingPayments.slice(0, 5).map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {payment.profiles?.full_name || "Customer"} · {money(payment.amount)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {humanize(payment.method)} · TrxID{" "}
                      <span className="font-mono">{payment.trx_id ?? "—"}</span>
                    </p>
                  </div>
                  <Link href="/admin/payments" className="btn btn-primary btn-sm">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">Nothing waiting. Nice.</p>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">New subscriptions</h2>
            <Link href="/admin/subscriptions" className="text-sm text-ink-soft hover:text-gold">
              View all
            </Link>
          </div>

          {pendingSubs.length ? (
            <ul className="mt-4 divide-y divide-line">
              {pendingSubs.slice(0, 5).map((subscription) => (
                <li key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {subscription.profiles?.full_name || "Customer"}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {subscription.plans?.name ?? "Plan"} ·{" "}
                      {formatDate(subscription.created_at)}
                    </p>
                  </div>
                  <StatusPill status={subscription.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">No pending sign-ups.</p>
          )}
        </section>
      </div>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-ink-soft hover:text-gold">
            View all
          </Link>
        </div>

        {recentOrders.length ? (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:text-gold">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="text-ink-soft">{order.profiles?.full_name || "—"}</td>
                    <td className="text-ink-soft">{formatDate(order.created_at)}</td>
                    <td className="text-ink">{money(order.total)}</td>
                    <td>
                      <StatusPill status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No orders yet.</p>
        )}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Rare book requests</h2>
          <Link href="/admin/requests" className="text-sm text-ink-soft hover:text-gold">
            View all
          </Link>
        </div>
        {requests.length ? (
          <ul className="mt-4 divide-y divide-line">
            {requests.slice(0, 5).map((request) => (
              <li key={request.id} className="py-3">
                <p className="text-sm font-medium text-ink">{request.title}</p>
                <p className="text-xs text-ink-muted">
                  {request.author || "Unknown author"} ·{" "}
                  {request.profiles?.full_name || request.contact || "Guest"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No open requests.</p>
        )}
      </section>
    </div>
  );
}
