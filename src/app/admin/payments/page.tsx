import Link from "next/link";

import { PaymentReview } from "@/components/admin/payment-review";
import { EmptyState, StatusPill } from "@/components/ui";
import { listPayments } from "@/lib/data";
import { formatDateTime, money } from "@/lib/format";

export const metadata = { title: "Payments" };

const filters = [
  ["", "All"],
  ["pending", "Pending"],
  ["verified", "Verified"],
  ["rejected", "Rejected"],
];

export default async function AdminPaymentsPage(props: PageProps<"/admin/payments">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const payments = await listPayments(status || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Payments</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Check the TrxID against your bKash/Nagad statement, then verify to activate the
            membership.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/payments?status=${value}` : "/admin/payments"}
            className={`btn btn-sm ${status === value ? "btn-primary" : "btn-outline"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState title="No payments here" description="Nothing matches this filter yet." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Method</th>
                <th>TrxID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap text-ink-soft">
                    {formatDateTime(payment.created_at)}
                  </td>
                  <td>
                    <p className="text-ink">{payment.profiles?.full_name || "—"}</p>
                    <p className="text-xs text-ink-muted">{payment.profiles?.phone || ""}</p>
                  </td>
                  <td className="text-ink-soft">{payment.orders?.order_number ?? "—"}</td>
                  <td className="text-ink-soft">
                    <span className="capitalize">{payment.method}</span>
                    {payment.sender_number ? (
                      <span className="block text-xs text-ink-muted">{payment.sender_number}</span>
                    ) : null}
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink">{payment.trx_id ?? "—"}</span>
                    {payment.screenshot_url ? (
                      <a
                        href={`/api/proof/${payment.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs text-gold underline"
                      >
                        View screenshot
                      </a>
                    ) : null}
                  </td>
                  <td className="text-ink">{money(payment.amount)}</td>
                  <td>
                    <StatusPill status={payment.status} />
                    {payment.reject_reason ? (
                      <p className="mt-1 max-w-[12rem] text-xs text-rose-600">
                        {payment.reject_reason}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    {payment.status === "pending" ? (
                      <PaymentReview paymentId={payment.id} />
                    ) : (
                      <span className="text-xs text-ink-muted">
                        {payment.verified_at ? formatDateTime(payment.verified_at) : "—"}
                      </span>
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
