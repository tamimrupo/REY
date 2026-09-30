import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm, MessageCustomerForm } from "@/components/admin/customer-form";
import { EmptyState, Stat, StatusPill } from "@/components/ui";
import {
  getCourierSettings,
  getCustomer,
  getCustomerDeposits,
  getCustomerOrders,
  getCustomerPayments,
  getCustomerRentals,
  getCustomerShipments,
  getCustomerSubscriptions,
} from "@/lib/data";
import { SHIPMENT_TYPE_LABELS, isOverdue, rentalStatusLabel, whatsappLink } from "@/lib/quotas";
import { phonesMatch } from "@/lib/phone";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Customer" };

export default async function AdminCustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const { id } = await props.params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [orders, payments, deposits, subscriptions, rentals, shipments, courierSettings] =
    await Promise.all([
      getCustomerOrders(id),
      getCustomerPayments(id),
      getCustomerDeposits(id),
      getCustomerSubscriptions(id),
      getCustomerRentals(id),
      getCustomerShipments(id),
      getCourierSettings(),
    ]);

  const lifetime = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const held = deposits
    .filter((deposit) => deposit.status === "held")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const borrowed = rentals.length;
  const openRentals = rentals.filter((rental) =>
    ["pending", "out", "returning"].includes(rental.status),
  );
  const overdue = openRentals.filter(isOverdue);

  const subscription = subscriptions[0] ?? null;
  const wa = whatsappLink(customer.phone, `Hello ${customer.full_name ?? "there"}, `);

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
        <div className="flex flex-wrap items-center gap-2">
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">
              WhatsApp
            </a>
          ) : null}
          <StatusPill
            status={customer.is_blocked ? "cancelled" : "active"}
            label={customer.is_blocked ? "Blocked" : "Active"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Lifetime value" value={money(lifetime)} />
        <Stat label="Books borrowed" value={borrowed} />
        <Stat label="With them now" value={openRentals.length} hint={`${overdue.length} overdue`} />
        <Stat label="Deposit held" value={money(held)} />
        <Stat
          label="Current plan"
          value={subscription?.plans?.name ?? "None"}
          hint={subscription ? subscription.status : "No subscription"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Profile</h2>
            <div className="mt-5">
              <CustomerForm
                profile={customer}
                couriers={courierSettings.methods.map((m) => ({ key: m.key, label: m.label }))}
              />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Message this customer</h2>
            <p className="mt-1 mb-5 text-sm text-ink-soft">
              Adds a message to the outbox, where you can send it by WhatsApp or email.
            </p>
            <MessageCustomerForm userId={customer.id} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Books</h2>
              <Link href="/admin/rentals?filter=open" className="text-sm text-ink-soft hover:text-gold">
                All books out
              </Link>
            </div>

            {rentals.length ? (
              <ul className="mt-4 divide-y divide-line text-sm">
                {rentals.slice(0, 10).map((rental) => (
                  <li key={rental.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-ink">{rental.books?.title ?? "Book"}</p>
                      <p className="text-xs text-ink-muted">
                        due {formatDate(rental.due_at)}
                        {rental.returned_at ? ` · returned ${formatDate(rental.returned_at)}` : ""}
                      </p>
                    </div>
                    <StatusPill
                      status={isOverdue(rental) ? "cancelled" : rental.status}
                      label={isOverdue(rental) ? "Overdue" : rentalStatusLabel(rental.status)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No books ever borrowed.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Shipments</h2>
            {shipments.length ? (
              <ul className="mt-4 divide-y divide-line text-sm">
                {shipments.slice(0, 8).map((shipment) => (
                  <li key={shipment.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-ink">{SHIPMENT_TYPE_LABELS[shipment.type]}</p>
                      <p className="text-xs text-ink-muted">
                        <span className="capitalize">{shipment.courier}</span> ·{" "}
                        {formatDate(shipment.created_at)}
                        {shipment.tracking ? ` · ${shipment.tracking}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-muted">
                        {Number(shipment.customer_charge) === 0
                          ? "free"
                          : money(shipment.customer_charge)}
                      </span>
                      <StatusPill status={shipment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No shipments yet.</p>
            )}
          </section>

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
                          <Link href={`/admin/orders/${order.id}`} className="text-ink hover:text-gold">
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
                    {payment.sender_number ? (
                      <span className="block text-xs text-ink-muted">
                        from {payment.sender_number}
                        {phonesMatch(payment.sender_number, customer.phone) === false ? (
                          <span className="ml-1 font-medium text-amber-700">
                            ⚠ not the profile number
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink">{money(payment.amount)}</span>
                    <StatusPill status={payment.status} />
                  </span>
                </li>
              ))}
              {deposits.map((deposit) => (
                <li key={deposit.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-ink-soft">
                    Security deposit
                    {deposit.refund_requested_at ? " · refund requested" : ""}
                  </span>
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

      {openRentals.length > 10 ? (
        <EmptyState
          title={`${openRentals.length} open rentals`}
          description="Open the Books out page to mark returns in bulk."
          actionHref="/admin/rentals?filter=open"
          actionLabel="Go to Books out"
        />
      ) : null}
    </div>
  );
}
