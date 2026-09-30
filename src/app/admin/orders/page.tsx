import Link from "next/link";

import { StatusSelect } from "@/components/admin/status-select";
import { EmptyState, StatusPill } from "@/components/ui";
import { setOrderStatusAction } from "@/lib/actions/admin";
import { listOrders } from "@/lib/data";
import { formatDate, humanize, money } from "@/lib/format";

export const metadata = { title: "Orders" };

const statuses = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const orders = await listOrders(status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every sign-up, renewal and fee, with the customer attached.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`btn btn-sm ${status === "" ? "btn-primary" : "btn-outline"}`}
        >
          All
        </Link>
        {statuses.map((option) => (
          <Link
            key={option}
            href={`/admin/orders?status=${option}`}
            className={`btn btn-sm ${status === option ? "btn-primary" : "btn-outline"}`}
          >
            {humanize(option)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders" description="Nothing matches this filter yet." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-ink hover:text-gold"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td>
                    <p className="text-ink">{order.profiles?.full_name || "—"}</p>
                    <p className="text-xs text-ink-muted">{order.profiles?.phone || ""}</p>
                  </td>
                  <td className="whitespace-nowrap text-ink-soft">{formatDate(order.created_at)}</td>
                  <td className="text-ink-soft">{humanize(order.type)}</td>
                  <td className="text-ink">{money(order.total)}</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td>
                    <StatusSelect
                      action={setOrderStatusAction}
                      id={order.id}
                      current={order.status}
                      options={statuses}
                    />
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
