import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentForm } from "@/components/payment-form";
import { Alert, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getOrder, getPaymentSettings } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage(props: PageProps<"/checkout/[id]">) {
  const { id } = await props.params;
  const session = await requireUser(`/checkout/${id}`);

  const [order, payments] = await Promise.all([getOrder(id), getPaymentSettings()]);

  if (!order || order.user_id !== session.userId) notFound();

  const items = order.order_items ?? [];
  const paid = order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered";
  const pendingPayment = ["pending", "verified"].includes(
    ((order as unknown as { payments?: { status: string }[] }).payments?.[0]?.status as string) ?? "",
  );

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-2 text-ink">Order {order.order_number}</h1>
          <p className="mt-2 text-sm text-ink-muted">Placed {formatDate(order.created_at)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          {paid ? (
            <Alert tone="success">
              <p className="font-semibold">Payment received — you are all set.</p>
              <p className="mt-1">
                Your membership is active and your first box is queued for delivery. You will get a
                call or SMS before the courier arrives.
              </p>
            </Alert>
          ) : pendingPayment ? (
            <Alert tone="warning">
              <p className="font-semibold">We are verifying your payment.</p>
              <p className="mt-1">
                Verification usually takes a few hours during business hours. We will email you as
                soon as it clears.
              </p>
            </Alert>
          ) : (
            <Alert tone="info">{payments.instructions}</Alert>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Your first box</h2>
            <ul className="mt-4 divide-y divide-line text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-ink-soft">{item.label}</span>
                  <span className="text-ink">
                    {item.unit_price > 0 ? money(item.unit_price) : "Included"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {!paid && !pendingPayment ? (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Submit your payment</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Pay by bKash, Nagad or Rocket, then paste the TrxID here.
              </p>
              <div className="mt-6">
                <PaymentForm
                  orderId={order.id}
                  amount={Number(order.total)}
                  userId={session.userId}
                  methods={payments.methods}
                />
              </div>
            </div>
          ) : null}

          {pendingPayment && !paid ? (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink">Sent the wrong TrxID?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Submit the correct one and we will match it to your order.
              </p>
              <div className="mt-6">
                <PaymentForm
                  orderId={order.id}
                  amount={Number(order.total)}
                  userId={session.userId}
                  methods={payments.methods}
                />
              </div>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Order total</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Plan (month 1)</dt>
                <dd className="text-ink">{money(order.subtotal)}</dd>
              </div>
              {Number(order.deposit_amount) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Refundable deposit</dt>
                  <dd className="text-ink">{money(order.deposit_amount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="text-ink">
                  {Number(order.delivery_fee) === 0 ? "Free" : money(order.delivery_fee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 font-display text-xl font-semibold">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-line pt-5 text-sm">
              <p className="text-ink-muted">
                Questions about this order? Email us and quote{" "}
                <span className="font-semibold text-ink">{order.order_number}</span>.
              </p>
              <Link href="/account/orders" className="btn btn-outline btn-sm mt-4 w-full">
                All my orders
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
