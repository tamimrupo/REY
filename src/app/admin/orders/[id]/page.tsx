import Link from "next/link";
import { notFound } from "next/navigation";

import { ShipmentForm } from "@/components/admin/shipment-forms";
import { StatusSelect } from "@/components/admin/status-select";
import { StatusPill } from "@/components/ui";
import { setOrderStatusAction } from "@/lib/actions/admin";
import { getOrder } from "@/lib/data";
import { SHIPMENT_TYPE_LABELS } from "@/lib/quotas";
import { formatDateTime, humanize, money } from "@/lib/format";

export const metadata = { title: "Order" };

const statuses = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = (await getOrder(id)) as any;
  if (!order) notFound();

  const deliveries: any[] = order.shipments ?? [];
  const payments: any[] = order.payments ?? [];
  const address = order.addresses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-ink">
            ← Orders
          </Link>
          <h1 className="mt-2 text-ink">{order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Placed {formatDateTime(order.created_at)} · {humanize(order.type)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={order.status} />
          <StatusSelect
            action={setOrderStatusAction}
            id={order.id}
            current={order.status}
            options={statuses}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Items</h2>
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items ?? []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="text-ink">{item.label}</td>
                    <td className="text-ink-soft">{item.quantity}</td>
                    <td className="text-ink">
                      {item.unit_price > 0 ? money(item.unit_price) : "Included"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-6 space-y-2 border-t border-ink pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Deposit</dt>
              <dd className="text-ink">{money(order.deposit_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="text-ink">{money(order.delivery_fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink pt-3 font-display text-lg font-semibold">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Customer</h2>
            <p className="mt-3 text-sm text-ink-soft">
              {order.profiles?.full_name || "—"}
              <br />
              {order.profiles?.phone || ""}
            </p>
            <Link
              href={`/admin/customers/${order.user_id}`}
              className="btn btn-outline btn-sm mt-4"
            >
              Open customer
            </Link>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Delivery address</h2>
            {address ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {address.recipient}
                <br />
                {address.phone}
                <br />
                {address.street}
                <br />
                {address.area} {address.city} {address.division}
                <br />
                {address.postcode}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No address on this order.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Payments</h2>
            {payments.length ? (
              <ul className="mt-3 divide-y divide-line text-sm">
                {payments.map((payment: any) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 py-2">
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
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No payment submitted yet.</p>
            )}
            <Link href="/admin/payments" className="btn btn-outline btn-sm mt-4">
              Go to payments
            </Link>
          </section>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Shipments</h2>
        {deliveries.length ? (
          <div className="mt-4 space-y-4">
            {deliveries.map((shipment: any) => (
              <details key={shipment.id} className="rounded-card border border-line p-4">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-ink">
                    {SHIPMENT_TYPE_LABELS[shipment.type as "outbound" | "swap" | "return"]} ·{" "}
                    <span className="capitalize">{shipment.courier}</span> ·{" "}
                    {shipment.tracking || shipment.bdpost_receipt || "no tracking code"}
                  </span>
                  <StatusPill status={shipment.status} />
                </summary>
                <div className="mt-5">
                  <ShipmentForm shipment={shipment} />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            No shipment yet. One is created when the customer confirms a box; the first trip is
            queued when you verify their payment.
          </p>
        )}
      </section>
    </div>
  );
}
