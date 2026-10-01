import Link from "next/link";

import { EmptyState, StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getMyDeposits, getMyPayments } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const session = await requireUser("/account/payments");
  const [payments, deposits] = await Promise.all([
    getMyPayments(session.userId),
    getMyDeposits(session.userId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink">Payments</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Every bKash, Nagad or Rocket payment you have submitted, and your deposit.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Security deposit</h2>
        {deposits.length ? (
          <ul className="mt-4 divide-y divide-line">
            {deposits.map((deposit) => (
              <li key={deposit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{money(deposit.amount)}</p>
                  <p className="text-xs text-ink-muted">Since {formatDate(deposit.created_at)}</p>
                </div>
                <StatusPill
                  status={deposit.status}
                  label={
                    deposit.status === "refunded"
                      ? "Refunded"
                      : deposit.status === "forfeited"
                        ? "Forfeited"
                        : deposit.refund_requested_at
                          ? "Refund requested"
                          : "Held · refundable"
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            No deposit on file yet — it is collected with your first order.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Payment history</h2>
        {payments.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No payments yet"
              description="Submit a bKash or Nagad payment from your order page and it will show up here."
              actionHref="/account/orders"
              actionLabel="Go to orders"
            />
          </div>
        ) : (
          <div className="mt-4 table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>TrxID</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-ink-soft">{formatDate(payment.created_at)}</td>
                    <td className="capitalize text-ink">{payment.method}</td>
                    <td className="font-mono text-xs text-ink-soft">{payment.trx_id ?? "—"}</td>
                    <td className="text-ink">{money(payment.amount)}</td>
                    <td>
                      <StatusPill status={payment.status} />
                      {payment.status === "rejected" && payment.reject_reason ? (
                        <p className="mt-1 text-xs text-ink">{payment.reject_reason}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-ink-muted">
          Need a receipt? <Link href="/contact" className="underline">Contact us</Link> with the
          TrxID.
        </p>
      </div>
    </div>
  );
}
