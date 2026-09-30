"use client";

import { ActionForm } from "@/components/forms/action-form";
import { saveSimpleSettingAction } from "@/lib/actions/admin";
import type {
  DeliverySettings,
  PaymentSettings,
  SiteSettings,
} from "@/lib/types";

export function SiteSettingsForm({ site }: { site: SiteSettings }) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save details" pendingLabel="Saving…">
      <input type="hidden" name="key" value="site" />
      <input type="hidden" name="kind" value="site" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Store name
          </label>
          <input id="name" name="name" className="field" defaultValue={site.name} />
        </div>
        <div>
          <label className="label" htmlFor="tagline">
            Tagline
          </label>
          <input id="tagline" name="tagline" className="field" defaultValue={site.tagline} />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Support email
          </label>
          <input id="email" name="email" type="email" className="field" defaultValue={site.email} />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Support phone
          </label>
          <input id="phone" name="phone" className="field" defaultValue={site.phone} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="address">
          Warehouse address
        </label>
        <input id="address" name="address" className="field" defaultValue={site.address} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="facebook">
            Facebook URL
          </label>
          <input id="facebook" name="facebook" className="field" defaultValue={site.facebook} />
        </div>
        <div>
          <label className="label" htmlFor="instagram">
            Instagram URL
          </label>
          <input id="instagram" name="instagram" className="field" defaultValue={site.instagram} />
        </div>
      </div>
    </ActionForm>
  );
}

export function AnnouncementForm({
  announcement,
}: {
  announcement: { enabled: boolean; text: string };
}) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save banner" pendingLabel="Saving…">
      <input type="hidden" name="key" value="announcement" />
      <input type="hidden" name="kind" value="announcement" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={announcement.enabled} />
        Show the announcement bar
      </label>

      <div>
        <label className="label" htmlFor="text">
          Text
        </label>
        <input id="text" name="text" className="field" defaultValue={announcement.text} />
      </div>
    </ActionForm>
  );
}

export function PaymentSettingsForm({ payments }: { payments: PaymentSettings }) {
  const rows = [0, 1, 2, 3];

  return (
    <ActionForm
      action={saveSimpleSettingAction}
      submitLabel="Save payment settings"
      pendingLabel="Saving…"
    >
      <input type="hidden" name="key" value="payments" />
      <input type="hidden" name="kind" value="payments" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={payments.enabled} />
        Accept bKash / Nagad payments
      </label>

      <div>
        <label className="label" htmlFor="instructions">
          Instructions shown at checkout
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          className="field"
          defaultValue={payments.instructions}
        />
      </div>

      <div className="space-y-3">
        <p className="label !mb-0">Numbers</p>
        {rows.map((index) => {
          const method = payments.methods[index];
          return (
            <div key={index} className="grid gap-2 sm:grid-cols-4">
              <input
                name={`method_key_${index}`}
                className="field"
                placeholder="bkash"
                defaultValue={method?.key ?? ""}
              />
              <input
                name={`method_label_${index}`}
                className="field"
                placeholder="bKash"
                defaultValue={method?.label ?? ""}
              />
              <input
                name={`method_number_${index}`}
                className="field"
                placeholder="017XXXXXXXX"
                defaultValue={method?.number ?? ""}
              />
              <input
                name={`method_type_${index}`}
                className="field"
                placeholder="Personal"
                defaultValue={method?.type ?? ""}
              />
            </div>
          );
        })}
        <p className="text-xs text-ink-muted">
          Leave a row blank to remove it. Key is the internal name (bkash, nagad, rocket).
        </p>
      </div>
    </ActionForm>
  );
}

export function DeliverySettingsForm({ delivery }: { delivery: DeliverySettings }) {
  const rows = [0, 1, 2, 3, 4];

  return (
    <ActionForm
      action={saveSimpleSettingAction}
      submitLabel="Save couriers"
      pendingLabel="Saving…"
    >
      <input type="hidden" name="key" value="delivery" />
      <input type="hidden" name="kind" value="delivery" />

      <div className="space-y-3">
        {rows.map((index) => {
          const method = delivery.methods[index];
          return (
            <div key={index} className="grid gap-2 sm:grid-cols-4">
              <input
                name={`courier_key_${index}`}
                className="field"
                placeholder="steadfast"
                defaultValue={method?.key ?? ""}
              />
              <input
                name={`courier_label_${index}`}
                className="field"
                placeholder="Steadfast"
                defaultValue={method?.label ?? ""}
              />
              <input
                name={`courier_fee_${index}`}
                type="number"
                className="field"
                placeholder="40"
                defaultValue={method?.fee ?? ""}
              />
              <input
                name={`courier_note_${index}`}
                className="field"
                placeholder="50% off"
                defaultValue={method?.note ?? ""}
              />
            </div>
          );
        })}
      </div>
    </ActionForm>
  );
}

export function DepositSettingsForm({
  deposit,
}: {
  deposit: { amount: number; note: string };
}) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save deposit" pendingLabel="Saving…">
      <input type="hidden" name="key" value="deposit" />
      <input type="hidden" name="kind" value="deposit" />

      <div>
        <label className="label" htmlFor="amount">
          Refundable deposit (৳)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="1"
          className="field sm:max-w-xs"
          defaultValue={deposit.amount}
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note shown to customers
        </label>
        <textarea id="note" name="note" rows={3} className="field" defaultValue={deposit.note} />
      </div>
    </ActionForm>
  );
}
