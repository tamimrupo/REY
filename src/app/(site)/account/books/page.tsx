import Link from "next/link";

import { Alert, EmptyState, StatusPill } from "@/components/ui";
import { BookCoverImage } from "@/components/book-cover";
import { ReturnForm, type CourierOption } from "@/components/account/box-forms";
import { requireUser } from "@/lib/auth";
import {
  getAddresses,
  getCourierSettings,
  getMembershipState,
  getMyShipments,
  getWarehouseSettings,
} from "@/lib/data";
import { SHIPMENT_TYPE_LABELS, couriersFor, isOverdue, rentalStatusLabel } from "@/lib/quotas";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "My books" };

export default async function MyBooksPage(props: PageProps<"/account/books">) {
  const session = await requireUser("/account/books");
  const search = await props.searchParams;

  const [state, shipments, addresses, courierSettings, warehouse] = await Promise.all([
    getMembershipState(session.userId),
    getMyShipments(session.userId),
    getAddresses(session.userId),
    getCourierSettings(),
    getWarehouseSettings(),
  ]);

  const returnCouriers: CourierOption[] = couriersFor(courierSettings, "return");
  const out = state.out;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-ink">My books</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {out.length
              ? `${out.length} book${out.length === 1 ? "" : "s"} with you right now.`
              : "Nothing with you at the moment."}
          </p>
        </div>
        <Link href="/account/box" className="btn btn-primary btn-sm">
          Pick more books
        </Link>
      </div>

      {search.confirmed ? (
        <Alert tone="success">
          Box confirmed. We will dispatch it with your saved courier and send you the tracking code.
        </Alert>
      ) : null}
      {search.returned ? (
        <Alert tone="success">
          Pickup requested. Keep the books until the courier arrives, and we will confirm the return
          once they reach us.
        </Alert>
      ) : null}

      {out.length ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink">With you</h2>
          <ul className="mt-4 divide-y divide-line">
            {out.map((rental) => {
              const late = isOverdue(rental);
              return (
                <li key={rental.id} className="flex items-center gap-4 py-3">
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-line bg-cream">
                    <BookCoverImage
                      url={rental.books?.cover_url}
                      title={rental.books?.title ?? "Book"}
                      size="sm"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/library/${rental.books?.slug ?? ""}`}
                      className="truncate text-sm font-medium text-ink hover:underline"
                    >
                      {rental.books?.title ?? "Book"}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {rental.books?.authors?.name ?? "—"} · due {formatDate(rental.due_at)}
                    </p>
                  </div>
                  <StatusPill
                    status={late ? "cancelled" : rental.status}
                    label={late ? "Overdue" : rentalStatusLabel(rental.status)}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">
            Books are due back by the end of your plan. Returning them frees up your slots for the
            next month, and old books come back on the same trip as your new ones.
          </p>
        </div>
      ) : (
        <EmptyState
          title="No books out"
          description="Once your box is dispatched your books appear here with their due dates."
          actionHref="/account/box"
          actionLabel="Go to my box"
        />
      )}

      {out.length ? (
        <ReturnForm
          couriers={returnCouriers}
          addresses={addresses}
          bdpostRules={courierSettings.bdpost.rules}
          warehouse={warehouse}
          outCount={out.length}
        />
      ) : null}

      <section>
        <h2 className="text-xl font-semibold text-ink">Deliveries</h2>
        {shipments.length ? (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trip</th>
                  <th>Courier</th>
                  <th>Books</th>
                  <th>Tracking</th>
                  <th>Your share</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => {
                  const items = shipment.shipment_items ?? [];
                  const goingOut = items.filter((item) => item.direction === "out").length;
                  const comingBack = items.filter((item) => item.direction === "in").length;
                  return (
                    <tr key={shipment.id}>
                      <td className="whitespace-nowrap text-ink-soft">
                        {formatDate(shipment.created_at)}
                      </td>
                      <td className="text-ink">{SHIPMENT_TYPE_LABELS[shipment.type]}</td>
                      <td className="capitalize text-ink-soft">{shipment.courier}</td>
                      <td className="text-ink-soft">
                        {goingOut ? `${goingOut} out` : null}
                        {goingOut && comingBack ? " · " : null}
                        {comingBack ? `${comingBack} back` : null}
                        {!goingOut && !comingBack ? "—" : null}
                      </td>
                      <td className="font-mono text-xs text-ink-soft">
                        {shipment.tracking ?? shipment.bdpost_receipt ?? "—"}
                      </td>
                      <td className="text-ink">
                        {Number(shipment.customer_charge) === 0
                          ? "Free"
                          : money(shipment.customer_charge)}
                      </td>
                      <td>
                        <StatusPill status={shipment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No deliveries yet.</p>
        )}
      </section>
    </div>
  );
}
