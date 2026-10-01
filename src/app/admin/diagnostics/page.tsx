import Link from "next/link";

import { RepairButton } from "@/components/admin/repair-button";
import { ActionForm } from "@/components/forms/action-form";
import { Alert, EmptyState, Stat, StatusPill } from "@/components/ui";
import { runMaintenanceAction } from "@/lib/actions/admin";
import { listOrderDiagnostics } from "@/lib/data";
import { formatDateTime, money } from "@/lib/format";

export const metadata = { title: "Diagnostics" };

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Answers the question "did this order actually produce what it should have?" —
 * membership, rentals and a shipment. Anything missing gets a one-click repair
 * that re-runs only the steps that never happened.
 */
function issuesFor(order: any): string[] {
  const issues: string[] = [];
  if (order.status === "pending_payment") return issues; // just waiting on money

  const bookLines = (order.order_items ?? []).filter((item: any) => item.book_id);
  const subscription = order.subscriptions;

  if (order.type === "subscription_signup" && !order.subscription_id) {
    issues.push("No membership linked to this plan order");
  }
  if (order.subscription_id && subscription?.status === "pending") {
    issues.push("Membership never activated");
  }
  if (bookLines.length && !(order.shipments ?? []).length) {
    issues.push("No shipment queued for the books");
  }
  if (order.subscription_id && order.deposit_amount > 0) {
    issues.push("Check the security deposit was recorded");
  }
  return issues;
}

export default async function AdminDiagnosticsPage() {
  const orders = await listOrderDiagnostics();

  const rows = orders.map((order) => ({ order, issues: issuesFor(order) }));
  const broken = rows.filter((row) => row.issues.length > 0);
  const healthy = rows.length - broken.length;

  const outstanding = orders
    .filter((order) => order.status === "pending_payment")
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Diagnostics</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Checks that every order produced the membership, rentals and shipment it should have. Fix
          a stuck order with one click.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Orders checked" value={rows.length} hint="Most recent 100" />
        <Stat label="Looking healthy" value={healthy} />
        <Stat
          label="Awaiting payment"
          value={money(outstanding)}
          hint="Not an error — just unpaid"
        />
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Daily maintenance</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Expires finished plans and queues renewal reminders. Vercel also runs this every day at
          03:00 Dhaka time.
        </p>
        <div className="mt-5">
          <ActionForm
            action={runMaintenanceAction}
            submitLabel="Run maintenance now"
            pendingLabel="Running…"
            className="space-y-4"
          />
        </div>
      </section>

      {broken.length === 0 ? (
        <EmptyState
          title="Nothing stuck"
          description="Every order in the last 100 either completed its pipeline or is simply waiting for payment."
        />
      ) : (
        <div className="space-y-4">
          <Alert tone="warning">
            {broken.length} order{broken.length === 1 ? "" : "s"} need attention.
          </Alert>

          {broken.map(({ order, issues }) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      {order.order_number}
                    </Link>
                    <span className="ml-2 font-normal text-ink-muted">
                      · {order.profiles?.full_name || "Customer"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDateTime(order.created_at)} · {order.type} ·{" "}
                    {order.profiles?.phone || "no phone"}
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>

              <ul className="mt-3 space-y-1 text-sm text-ink">
                {issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <RepairButton orderId={order.id} />
                <Link href={`/admin/orders/${order.id}`} className="btn btn-ghost btn-sm">
                  Open order
                </Link>
                {order.user_id ? (
                  <Link href={`/admin/customers/${order.user_id}`} className="btn btn-ghost btn-sm">
                    Open customer
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Membership</th>
              <th>Trips</th>
              <th>Book lines</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map(({ order }) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`} className="text-ink hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="text-ink-soft">{order.profiles?.full_name || "—"}</td>
                <td>
                  <StatusPill status={order.status} />
                </td>
                <td className="text-ink-soft">{order.subscriptions?.status ?? "—"}</td>
                <td className="text-ink-soft">{(order.shipments ?? []).length}</td>
                <td className="text-ink-soft">
                  {(order.order_items ?? []).filter((item: any) => item.book_id).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
