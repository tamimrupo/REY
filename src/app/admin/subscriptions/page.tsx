import Link from "next/link";

import { StatusSelect } from "@/components/admin/status-select";
import { EmptyState, StatusPill } from "@/components/ui";
import { setSubscriptionStatusAction } from "@/lib/actions/admin";
import { listSubscriptions } from "@/lib/data";
import { formatDate, humanize, money } from "@/lib/format";

export const metadata = { title: "Subscriptions" };

const statuses = ["pending", "active", "paused", "cancelled", "expired"];

export default async function AdminSubscriptionsPage(props: PageProps<"/admin/subscriptions">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const subscriptions = await listSubscriptions(status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Subscriptions</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Who is on which plan, when they are billed, and who needs a nudge.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/subscriptions"
          className={`btn btn-sm ${status === "" ? "btn-primary" : "btn-outline"}`}
        >
          All
        </Link>
        {statuses.map((option) => (
          <Link
            key={option}
            href={`/admin/subscriptions?status=${option}`}
            className={`btn btn-sm ${status === option ? "btn-primary" : "btn-outline"}`}
          >
            {humanize(option)}
          </Link>
        ))}
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState title="No subscriptions" description="Nothing matches this filter yet." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Started</th>
                <th>Next billing</th>
                <th>Value</th>
                <th>Status</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <Link
                      href={`/admin/customers/${subscription.user_id}`}
                      className="text-ink hover:text-gold"
                    >
                      {subscription.profiles?.full_name || "—"}
                    </Link>
                    <p className="text-xs text-ink-muted">{subscription.profiles?.phone || ""}</p>
                  </td>
                  <td className="text-ink-soft">{subscription.plans?.name ?? "—"}</td>
                  <td className="whitespace-nowrap text-ink-soft">
                    {formatDate(subscription.started_at ?? subscription.created_at)}
                  </td>
                  <td className="whitespace-nowrap text-ink-soft">
                    {formatDate(subscription.next_billing_date)}
                  </td>
                  <td className="text-ink">{money(subscription.plans?.price_monthly ?? 0)}</td>
                  <td>
                    <StatusPill status={subscription.status} />
                  </td>
                  <td>
                    <StatusSelect
                      action={setSubscriptionStatusAction}
                      id={subscription.id}
                      current={subscription.status}
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
