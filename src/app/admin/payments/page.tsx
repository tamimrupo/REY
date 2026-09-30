import Link from "next/link";

import { PaymentReview } from "@/components/admin/payment-review";
import { Alert, EmptyState, StatusPill } from "@/components/ui";
import { listPayments } from "@/lib/data";
import { phonesMatch } from "@/lib/phone";
import { formatDateTime, money } from "@/lib/format";

export const metadata = { title: "Payments" };

const filters = [
  ["", "All"],
  ["pending", "Pending"],
  ["verified", "Verified"],
  ["rejected", "Rejected"],
];

/**
 * Free fraud signal: did this bKash/Nagad payment come from the number the
 * customer registered with? People legitimately pay from a family member's
 * phone, so this flags for review rather than blocking anything.
 */
function SenderMatch({
  sender,
  profilePhone,
}: {
  sender: string | null;
  profilePhone: string | null | undefined;
}) {
  const match = phonesMatch(sender, profilePhone);
  if (match === false) {
    return (
      <span className="mt-1 block text-xs font-medium text-amber-700">
        ⚠ Different number than the profile
      </span>
    );
  }
  if (match === true) {
    return <span className="mt-1 block text-xs text-emerald-700">Matches profile phone</span>;
  }
  return null;
}

export default async function AdminPaymentsPage(props: PageProps<"/admin/payments">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const payments = await listPayments(status || undefined);

  const mismatched = payments.filter(
    (payment) =>
      payment.status === "pending" &&
      phonesMatch(payment.sender_number, payment.profiles?.phone) === false,
  );

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

      {mismatched.length > 0 ? (
        <Alert tone="warning">
          <p className="font-semibold">
            {mismatched.length} payment{mismatched.length === 1 ? "" : "s"} came from a different
            number than the customer&apos;s profile phone.
          </p>
          <p className="mt-1">
            Not proof of fraud — people often pay from a family member&apos;s bKash. Check against
            your statement, and hold the order if anything feels off.
          </p>
        </Alert>
      ) : null}

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
                    <SenderMatch
                      sender={payment.sender_number}
                      profilePhone={payment.profiles?.phone}
                    />
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
