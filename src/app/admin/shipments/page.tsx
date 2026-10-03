import Link from "next/link";

import { ShipmentForm } from "@/components/admin/shipment-forms";
import { EmptyState, Stat, StatusPill } from "@/components/ui";
import { listShipments } from "@/lib/data";
import { SHIPMENT_TYPE_LABELS } from "@/lib/quotas";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Shipments" };

const STATUS_FILTERS = [
  ["", "All"],
  ["pending", "To dispatch"],
  ["awaiting_post", "At the post office"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

const TYPE_FILTERS = [
  ["", "Every trip"],
  ["outbound", "First deliveries"],
  ["swap", "Swaps"],
  ["return", "Returns"],
];

export default async function AdminShipmentsPage(props: PageProps<"/admin/shipments">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const type = typeof search.type === "string" ? search.type : "";
  const all = await listShipments(status || undefined);
  const shipments = type ? all.filter((shipment) => shipment.type === type) : all;

  const toDispatch = shipments.filter((s) => ["pending", "packed"].includes(s.status)).length;
  const returns = shipments.filter((s) => s.type === "return" && ["pending", "awaiting_post"].includes(s.status)).length;
  const owed = shipments
    .filter((s) => s.status !== "cancelled")
    .reduce((sum, s) => sum + Number(s.customer_charge), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Shipments</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every trip: first deliveries, swaps (new books out + old books back on one trip) and
          returns.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Waiting to dispatch" value={toDispatch} />
        <Stat label="Returns in progress" value={returns} />
        <Stat label="Charged to customers" value={money(owed)} hint="Sum of customer shares" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(([value, label]) => (
            <Link
              key={label}
              href={`/admin/shipments?${new URLSearchParams({ ...(value ? { status: value } : {}), ...(type ? { type } : {}) })}`}
              className={`btn btn-sm ${status === value ? "btn-primary" : "btn-outline"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(([value, label]) => (
            <Link
              key={label}
              href={`/admin/shipments?${new URLSearchParams({ ...(status ? { status } : {}), ...(value ? { type: value } : {}) })}`}
              className={`btn btn-sm ${type === value ? "btn-primary" : "btn-outline"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {shipments.length === 0 ? (
        <EmptyState
          title="No shipments"
          description="Trips appear here automatically when a customer confirms a box or requests a pickup."
        />
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const items = shipment.shipment_items ?? [];
            const out = items.filter((item) => item.direction === "out");
            const back = items.filter((item) => item.direction === "in");

            return (
              <details key={shipment.id} className="card p-5">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {shipment.profiles?.full_name || "Customer"}
                      <span className="ml-2 font-normal text-ink-muted">
                        · {SHIPMENT_TYPE_LABELS[shipment.type]}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      <span className="capitalize">{shipment.courier}</span> ·{" "}
                      {formatDate(shipment.created_at)} · {out.length} out
                      {back.length ? ` · ${back.length} back` : ""} ·{" "}
                      {Number(shipment.customer_charge) === 0
                        ? "free"
                        : `${money(shipment.customer_charge)} charged`}
                      {shipment.orders?.order_number ? ` · ${shipment.orders.order_number}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {shipment.tracking ? (
                      <span className="font-mono text-xs text-ink-soft">{shipment.tracking}</span>
                    ) : null}
                    {shipment.bdpost_receipt ? (
                      <span className="font-mono text-xs text-ink-soft">
                        receipt {shipment.bdpost_receipt}
                      </span>
                    ) : null}
                    <StatusPill status={shipment.status} />
                  </div>
                </summary>

                <div className="mt-5 space-y-5 border-t border-ink pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="label">Going out</p>
                      {out.length ? (
                        <ul className="space-y-1 text-sm text-ink-soft">
                          {out.map((item) => (
                            <li key={item.id}>
                              {item.rentals?.books?.title ?? "Book"}{" "}
                              <span className="text-xs text-ink-muted">
                                ({item.rentals?.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-ink-muted">Nothing</p>
                      )}
                    </div>
                    <div>
                      <p className="label">Coming back</p>
                      {back.length ? (
                        <ul className="space-y-1 text-sm text-ink-soft">
                          {back.map((item) => (
                            <li key={item.id}>
                              {item.rentals?.books?.title ?? "Book"}{" "}
                              <span className="text-xs text-ink-muted">
                                ({item.rentals?.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-ink-muted">Nothing</p>
                      )}
                    </div>
                  </div>

                  {shipment.addresses ? (
                    <div className="rounded-card bg-cream/50 p-4 text-sm text-ink-soft">
                      <p className="font-medium text-ink">Deliver to</p>
                      <p className="mt-1">
                        {shipment.addresses.recipient} · {shipment.addresses.phone}
                        <br />
                        {shipment.addresses.street}, {shipment.addresses.area}{" "}
                        {shipment.addresses.city} {shipment.addresses.division}
                      </p>
                    </div>
                  ) : null}

                  <ShipmentForm shipment={shipment} />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
