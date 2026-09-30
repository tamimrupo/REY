import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "@/components/admin/customer-form";
import { Stat, StatusPill } from "@/components/ui";
import {
  getCustomer,
  getCustomerDeposits,
  getCustomerOrders,
  getCustomerPayments,
  getCustomerSubscriptions,
} from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Customer" };

export default async function AdminCustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [orders, payments, deposits, subscriptions] = await Promise.all([
    getCustomerOrders(id),
    getCustomerPayments(id),
    getCustomerDeposits(id),
    getCustomerSubscriptions(id),
  ]);

  const lifetime = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const held = deposits
    .filter((deposit) => deposit.status === "held")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const borrowed = orders.reduce(
    (sum, order) => sum + (order.order_items?.filter((item) => item.book_id).length ?? 0),
    0,
  );

  const subscription = subscriptions[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/customers" className="text-sm text-ink-soft hover:text-gold">
            ← Customers
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{customer.full_name || "Unnamed"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {customer.phone || "no phone"} · joined {formatDate(customer.created_at)}
          </p>
        </div>
        <StatusPill
          status={customer.is_blocked ? "cancelled" : "active"}
          label={customer.is_blocked ? "Blocked" : "Active"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Lifetime value" value={money(lifetime)} />
        <Stat label="Books borrowed" value={borrowed} />
        <Stat label="Deposit held" value={money(held)} />
        <Stat
          label="Current plan"
          value={subscription?.plans?.name ?? "None"}
          hint={subscription ? subscription.status : "No subscription"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Profile</h2>
          <div className="mt-5">
            <CustomerForm profile={customer} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Subscriptions</h2>
            {subscriptions.length ? (
              <ul className="mt-4 divide-y divide-line text-sm">
                {subscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-ink">{sub.plans?.name ?? "Plan"}</p>
                      <p className="text-xs text-ink-muted">
                        Next billing {formatDate(sub.next_billing_date)}
                      </p>
                    </div>
                    <StatusPill status={sub.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No subscriptions.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Orders</h2>
            {orders.length ? (
              <div className="mt-4 table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-ink hover:text-gold"
                          >
                            {order.order_number}
                          </Link>
                        </td>
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
              <p className="mt-3 text-sm text-ink-muted">No orders.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Payments &amp; deposits</h2>
            <ul className="mt-4 divide-y divide-line text-sm">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-ink-soft">
                    <span className="capitalize">{payment.method}</span> ·{" "}
                    <span className="font-mono text-xs">{payment.trx_id ?? "—"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink">{money(payment.amount)}</span>
                    <StatusPill status={payment.status} />
                  </span>
                </li>
              ))}
              {deposits.map((deposit) => (
                <li key={deposit.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-ink-soft">Security deposit</span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink">{money(deposit.amount)}</span>
                    <StatusPill status={deposit.status} />
                  </span>
                </li>
              ))}
              {payments.length === 0 && deposits.length === 0 ? (
                <li className="py-2.5 text-ink-muted">Nothing recorded yet.</li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
