import { DeliveryForm } from "@/components/admin/delivery-forms";
import { EmptyState, StatusPill } from "@/components/ui";
import { listDeliveries } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Deliveries" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminDeliveriesPage() {
  const deliveries = (await listDeliveries()) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Deliveries</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Dispatch, tracking numbers and returns for every box.
        </p>
      </div>

      {deliveries.length === 0 ? (
        <EmptyState
          title="No deliveries yet"
          description="A delivery row is created automatically when you verify a first payment."
        />
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <details key={delivery.id} className="card p-5">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {delivery.orders?.order_number ?? `Delivery ${delivery.id.slice(0, 8)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <span className="capitalize">{delivery.courier}</span> · created{" "}
                    {formatDate(delivery.created_at)} · fee {money(delivery.fee)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {delivery.tracking_code ? (
                    <span className="font-mono text-xs text-ink-soft">
                      {delivery.tracking_code}
                    </span>
                  ) : null}
                  <StatusPill status={delivery.status} />
                </div>
              </summary>

              <div className="mt-5 border-t border-line pt-5">
                <DeliveryForm delivery={delivery} />
                {delivery.dispatched_at || delivery.delivered_at ? (
                  <p className="mt-4 text-xs text-ink-muted">
                    Dispatched {formatDate(delivery.dispatched_at)} · Delivered{" "}
                    {formatDate(delivery.delivered_at)}
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
