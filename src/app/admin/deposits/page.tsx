import Link from "next/link";

import { DepositForm } from "@/components/admin/shipment-forms";
import { EmptyState, Stat, StatusPill } from "@/components/ui";
import { listDeposits } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Deposits" };

export default async function AdminDepositsPage(props: PageProps<"/admin/deposits">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const deposits = await listDeposits(status || undefined);

  const held = deposits
    .filter((deposit) => deposit.status === "held")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const refunded = deposits
    .filter((deposit) => deposit.status === "refunded")
    .reduce((sum, deposit) => sum + Number(deposit.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Deposits</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Refundable balances we are holding for members, and refunds already sent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Currently held" value={money(held)} hint="Owed back to members" />
        <Stat label="Refunded to date" value={money(refunded)} />
        <Stat label="Records" value={deposits.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["", "All"],
          ["held", "Held"],
          ["refunded", "Refunded"],
          ["forfeited", "Forfeited"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/deposits?status=${value}` : "/admin/deposits"}
            className={`btn btn-sm ${status === value ? "btn-primary" : "btn-outline"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {deposits.length === 0 ? (
        <EmptyState
          title="No deposits"
          description="A deposit row appears when you verify a first payment."
        />
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <details key={deposit.id} className="card p-5">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {deposit.profiles?.full_name || "Customer"} · {money(deposit.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {deposit.profiles?.phone || ""} · since {formatDate(deposit.created_at)}
                  </p>
                </div>
                <StatusPill status={deposit.status} />
              </summary>
              <div className="mt-5 border-t border-line pt-5">
                <DepositForm deposit={deposit} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
