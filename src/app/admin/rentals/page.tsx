import Link from "next/link";

import { EmptyState, Stat, StatusPill } from "@/components/ui";
import { markAllReturnedAction, markRentalReturnedAction } from "@/lib/actions/admin";
import { listRentals } from "@/lib/data";
import { isOverdue, rentalStatusLabel } from "@/lib/quotas";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Books out" };

const FILTERS = [
  ["open", "Everything open"],
  ["overdue", "Overdue"],
  ["pending", "In a box"],
  ["out", "With customers"],
  ["returning", "Coming back"],
  ["returned", "Returned"],
];

export default async function AdminRentalsPage(props: PageProps<"/admin/rentals">) {
  const search = await props.searchParams;
  const filter = typeof search.filter === "string" ? search.filter : "open";

  const rentals = await listRentals(
    filter === "open"
      ? { open: true }
      : filter === "overdue"
        ? { overdue: true }
        : { status: filter },
  );

  const overdue = rentals.filter(isOverdue);
  const withCustomers = rentals.filter((r) => ["out", "returning"].includes(r.status));
  const replacementValue = withCustomers.reduce(
    (sum, rental) => sum + Number(rental.replacement_value),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Books out</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every book in a box, with a customer, or on its way back.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="With customers" value={withCustomers.length} />
        <Stat label="Overdue" value={overdue.length} hint="Past their due date" />
        <Stat
          label="Value at risk"
          value={money(replacementValue)}
          hint="Replacement cost of books out"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/rentals?filter=${value}`}
            className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-outline"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {rentals.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description="No rentals match this filter right now."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Due</th>
                <th>Replacement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((rental) => {
                const late = isOverdue(rental);
                return (
                  <tr key={rental.id}>
                    <td className="max-w-[16rem]">
                      <Link
                        href={`/library/${rental.books?.slug ?? ""}`}
                        className="font-medium text-ink hover:text-gold"
                      >
                        {rental.books?.title ?? "Book"}
                      </Link>
                      <p className="text-xs text-ink-muted">{rental.books?.authors?.name ?? ""}</p>
                    </td>
                    <td>
                      <Link
                        href={`/admin/customers/${rental.user_id}`}
                        className="text-ink hover:text-gold"
                      >
                        {rental.profiles?.full_name || "Customer"}
                      </Link>
                      <p className="text-xs text-ink-muted">{rental.profiles?.phone ?? ""}</p>
                    </td>
                    <td>
                      <StatusPill
                        status={late ? "cancelled" : rental.status}
                        label={late ? "Overdue" : rentalStatusLabel(rental.status)}
                      />
                    </td>
                    <td className="whitespace-nowrap text-ink-soft">{formatDate(rental.due_at)}</td>
                    <td className="text-ink">{money(rental.replacement_value)}</td>
                    <td>
                      {["pending", "out", "returning"].includes(rental.status) ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={markRentalReturnedAction}>
                            <input type="hidden" name="id" value={rental.id} />
                            <button type="submit" className="btn btn-outline btn-sm">
                              Mark returned
                            </button>
                          </form>
                          <form action={markRentalReturnedAction}>
                            <input type="hidden" name="id" value={rental.id} />
                            <input type="hidden" name="lost" value="true" />
                            <button type="submit" className="btn btn-ghost btn-sm text-rose-600">
                              Lost
                            </button>
                          </form>
                          <form action={markAllReturnedAction}>
                            <input type="hidden" name="user_id" value={rental.user_id} />
                            <button type="submit" className="btn btn-ghost btn-sm">
                              All of theirs
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {formatDate(rental.returned_at ?? rental.lost_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
