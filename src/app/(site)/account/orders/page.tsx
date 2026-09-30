import Link from "next/link";

import { EmptyState, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await requireUser("/account/orders");
  const orders = await getMyOrders(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Orders</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Every payment, box and renewal on your account.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Your first order appears here once you pick a plan."
          actionHref="/plans"
          actionLabel="See the plans"
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium text-ink">{order.order_number}</td>
                  <td className="text-ink-soft">{formatDate(order.created_at)}</td>
                  <td className="text-ink-soft">{order.order_items?.length ?? 0}</td>
                  <td className="text-ink">{money(order.total)}</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td className="text-right">
                    {order.status === "pending_payment" ? (
                      <Link href={`/checkout/${order.id}`} className="btn btn-primary btn-sm">
                        Pay now
                      </Link>
                    ) : (
                      <Link href={`/checkout/${order.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
