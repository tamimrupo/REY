import Link from "next/link";

import { EmptyState, StatusPill } from "@/components/ui";
import { listCustomers } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  const search = await props.searchParams;
  const q = typeof search.q === "string" ? search.q : "";
  const customers = await listCustomers(q || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {customers.length} account{customers.length === 1 ? "" : "s"}. Open one for rental history,
          deposits and notes.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or phone…"
          className="field sm:max-w-xs"
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Search
        </button>
        {q ? (
          <Link href="/admin/customers" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      {customers.length === 0 ? (
        <EmptyState title="No customers found" description="Try a different search." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-xs font-semibold text-ink-soft">
                        {initials(customer.full_name)}
                      </span>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium text-ink hover:text-gold"
                      >
                        {customer.full_name || "Unnamed"}
                      </Link>
                    </div>
                  </td>
                  <td className="text-ink-soft">{customer.phone || "—"}</td>
                  <td className="capitalize text-ink-soft">{customer.role}</td>
                  <td className="whitespace-nowrap text-ink-soft">{formatDate(customer.created_at)}</td>
                  <td>
                    <StatusPill
                      status={customer.is_blocked ? "cancelled" : "active"}
                      label={customer.is_blocked ? "Blocked" : "Active"}
                    />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Open
                    </Link>
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
