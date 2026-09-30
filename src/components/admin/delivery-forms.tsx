import { ActionForm } from "@/components/forms/action-form";
import { saveDeliveryAction, refundDepositAction } from "@/lib/actions/admin";
import type { Delivery, Deposit } from "@/lib/types";
import { formatDate, money } from "@/lib/format";

const couriers = ["steadfast", "pathao", "redx", "bdpost", "other"];
const statuses = ["pending", "dispatched", "in_transit", "delivered", "returned", "failed"];

export function DeliveryForm({ delivery }: { delivery: Delivery }) {
  return (
    <ActionForm
      action={saveDeliveryAction}
      submitLabel="Save delivery"
      pendingLabel="Saving…"
      className="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={delivery.id} />

      <div>
        <label className="label" htmlFor={`courier-${delivery.id}`}>
          Courier
        </label>
        <select
          id={`courier-${delivery.id}`}
          name="courier"
          defaultValue={delivery.courier}
          className="field capitalize"
        >
          {couriers.map((courier) => (
            <option key={courier} value={courier}>
              {courier}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`status-${delivery.id}`}>
          Status
        </label>
        <select
          id={`status-${delivery.id}`}
          name="status"
          defaultValue={delivery.status}
          className="field capitalize"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`tracking-${delivery.id}`}>
          Tracking code
        </label>
        <input
          id={`tracking-${delivery.id}`}
          name="tracking_code"
          className="field"
          defaultValue={delivery.tracking_code ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor={`notes-${delivery.id}`}>
          Notes
        </label>
        <input
          id={`notes-${delivery.id}`}
          name="notes"
          className="field"
          defaultValue={delivery.notes ?? ""}
        />
      </div>
    </ActionForm>
  );
}

export function DepositForm({ deposit }: { deposit: Deposit }) {
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
        <p className="text-xs text-ink-muted">Held since {formatDate(deposit.created_at)}</p>
      </div>

      <div>
        <label className="label" htmlFor={`status-${deposit.id}`}>
          Status
        </label>
        <select
          id={`status-${deposit.id}`}
          name="status"
          defaultValue={deposit.status}
          className="field"
        >
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
