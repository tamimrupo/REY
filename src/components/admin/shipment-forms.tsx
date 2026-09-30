"use client";

import { ActionForm } from "@/components/forms/action-form";
import { refundDepositAction, saveShipmentAction } from "@/lib/actions/admin";
import { money } from "@/lib/format";
import { SHIPMENT_STATUS_FLOW } from "@/lib/quotas";
import type { Deposit, Shipment } from "@/lib/types";

const COURIERS = ["steadfast", "pathao", "redx", "bdpost", "other"];

/**
 * One trip in, one trip out. Marking a shipment `shipped`/`delivered` puts the
 * outbound books in the customer's hands; `completed` books the returns back in.
 */
export function ShipmentForm({ shipment }: { shipment: Shipment }) {
  return (
    <ActionForm
      action={saveShipmentAction}
      submitLabel="Save trip"
      pendingLabel="Saving…"
      className="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={shipment.id} />

      <div>
        <label className="label" htmlFor={`courier-${shipment.id}`}>
          Courier
        </label>
        <select
          id={`courier-${shipment.id}`}
          name="courier"
          defaultValue={shipment.courier}
          className="field capitalize"
        >
          {COURIERS.map((courier) => (
            <option key={courier} value={courier}>
              {courier}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`status-${shipment.id}`}>
          Status
        </label>
        <select
          id={`status-${shipment.id}`}
          name="status"
          defaultValue={shipment.status}
          className="field capitalize"
        >
          {SHIPMENT_STATUS_FLOW.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-muted">
          `shipped` hands the books over · `completed` books the returns back in.
        </p>
      </div>

      <div>
        <label className="label" htmlFor={`tracking-${shipment.id}`}>
          Tracking code
        </label>
        <input
          id={`tracking-${shipment.id}`}
          name="tracking"
          className="field"
          defaultValue={shipment.tracking ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor={`receipt-${shipment.id}`}>
          BD Post receipt
        </label>
        <input
          id={`receipt-${shipment.id}`}
          name="bdpost_receipt"
          className="field"
          defaultValue={shipment.bdpost_receipt ?? ""}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor={`notes-${shipment.id}`}>
          Notes
        </label>
        <input
          id={`notes-${shipment.id}`}
          name="notes"
          className="field"
          defaultValue={shipment.notes ?? ""}
        />
      </div>
    </ActionForm>
  );
}

export function DepositForm({ deposit }: { deposit: Deposit }) {
  const requested = Boolean(deposit.refund_requested_at);

  return (
    <ActionForm
      action={refundDepositAction}
      submitLabel="Save deposit"
      pendingLabel="Saving…"
      className="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={deposit.id} />

      <div>
        <span className="label">Amount</span>
        <p className="py-2 text-sm text-ink">{money(deposit.amount)}</p>
        <p className="text-xs text-ink-muted">
          {requested
            ? `Refund requested ${new Date(deposit.refund_requested_at as string).toLocaleDateString("en-GB")}`
            : "Not requested yet"}
        </p>
      </div>

      <div>
        <label className="label" htmlFor={`status-${deposit.id}`}>
          Status
        </label>
        <select id={`status-${deposit.id}`} name="status" defaultValue={deposit.status} className="field">
          <option value="held">Held</option>
          <option value="refunded">Refunded</option>
          <option value="forfeited">Forfeited</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`trx-${deposit.id}`}>
          Refund TrxID
        </label>
        <input
          id={`trx-${deposit.id}`}
          name="refund_trx_id"
          className="field"
          defaultValue={deposit.refund_trx_id ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor={`notes-${deposit.id}`}>
          Notes
        </label>
        <input
          id={`notes-${deposit.id}`}
          name="notes"
          className="field"
          defaultValue={deposit.notes ?? ""}
        />
      </div>
    </ActionForm>
  );
}
