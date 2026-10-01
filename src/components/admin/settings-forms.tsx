"use client";

import { ActionForm } from "@/components/forms/action-form";
import { saveSimpleSettingAction } from "@/lib/actions/admin";
import { money } from "@/lib/format";
import type {
  CourierSettings,
  PaymentSettings,
  RentalSettings,
  SiteSettings,
  WarehouseSettings,
  WhatsappSettings,
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
              <input name={`method_key_${index}`} className="field" placeholder="bkash" defaultValue={method?.key ?? ""} />
              <input name={`method_label_${index}`} className="field" placeholder="bKash" defaultValue={method?.label ?? ""} />
              <input name={`method_number_${index}`} className="field" placeholder="017XXXXXXXX" defaultValue={method?.number ?? ""} />
              <input name={`method_type_${index}`} className="field" placeholder="Personal" defaultValue={method?.type ?? ""} />
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

/**
 * Courier rates: the real charge and the percentage the customer covers.
 * Example: charge 80, percent 50 → the customer pays ৳40 and the shop pays ৳40.
 */
export function CourierSettingsForm({ couriers }: { couriers: CourierSettings }) {
  const rows = [0, 1, 2, 3, 4];

  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save couriers" pendingLabel="Saving…">
      <input type="hidden" name="key" value="couriers" />
      <input type="hidden" name="kind" value="couriers" />

      <div className="space-y-3">
        <div className="label-mono hidden gap-2 sm:grid sm:grid-cols-5">
          <span>Key</span>
          <span>Label</span>
          <span>Charge ৳</span>
          <span>Customer %</span>
          <span>Return ৳</span>
        </div>
        {rows.map((index) => {
          const method = couriers.methods[index];
          const charge = method?.charge ?? 0;
          const percent = method?.percent ?? 50;
          return (
            <div key={index} className="grid gap-2 sm:grid-cols-5">
              <input name={`courier_key_${index}`} className="field" placeholder="steadfast" defaultValue={method?.key ?? ""} />
              <input name={`courier_label_${index}`} className="field" placeholder="Steadfast" defaultValue={method?.label ?? ""} />
              <input name={`courier_charge_${index}`} type="number" step="1" className="field" defaultValue={method?.charge ?? ""} />
              <input name={`courier_percent_${index}`} type="number" step="1" min={0} max={100} className="field" defaultValue={method?.percent ?? ""} />
              <input name={`courier_return_${index}`} type="number" step="1" className="field" defaultValue={method?.return_charge ?? ""} />
              {method ? (
                <p className="text-xs text-ink sm:col-span-5">
                  Customer pays {money(Math.round(charge * (percent / 100) * 100) / 100)} of{" "}
                  {money(charge)} · shop covers {money(Math.round((charge - charge * (percent / 100)) * 100) / 100)}
                </p>
              ) : null}
            </div>
          );
        })}
        <p className="text-xs text-ink-muted">
          Leave a row blank to remove that courier. Return ৳ is used when the customer sends books back.
        </p>
      </div>

      <div className="rounded-card border border-line bg-cream/40 p-4">
        <p className="text-sm font-semibold text-ink">BD Post (Book Post)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="bdpost_label">
              Label
            </label>
            <input id="bdpost_label" name="bdpost_label" className="field" defaultValue={couriers.bdpost.label} />
          </div>
          <div>
            <label className="label" htmlFor="bdpost_charge">
              Charge ৳
            </label>
            <input id="bdpost_charge" name="bdpost_charge" type="number" step="1" className="field" defaultValue={couriers.bdpost.charge} />
          </div>
          <div>
            <label className="label" htmlFor="bdpost_max_kg">
              Max weight (kg)
            </label>
            <input id="bdpost_max_kg" name="bdpost_max_kg" type="number" step="0.5" className="field" defaultValue={couriers.bdpost.max_kg} />
          </div>
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="bdpost_rules">
            Book Packet rules shown to customers
          </label>
          <textarea id="bdpost_rules" name="bdpost_rules" rows={6} className="field" defaultValue={couriers.bdpost.rules} />
        </div>
      </div>
    </ActionForm>
  );
}

export function RentalSettingsForm({ rental }: { rental: RentalSettings }) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save rental rules" pendingLabel="Saving…">
      <input type="hidden" name="key" value="rental" />
      <input type="hidden" name="kind" value="rental" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div>
          <label className="label" htmlFor="duration_days">
            Plan length (days)
          </label>
          <input id="duration_days" name="duration_days" type="number" min={1} className="field" defaultValue={rental.duration_days} />
        </div>
        <div>
          <label className="label" htmlFor="renew_notice_days">
            Renewal reminder (days before)
          </label>
          <input id="renew_notice_days" name="renew_notice_days" type="number" min={1} max={30} className="field" defaultValue={rental.renew_notice_days} />
        </div>
        <div>
          <label className="label" htmlFor="max_parallel_rentals">
            Max books out at once (0 = plan limit)
          </label>
          <input id="max_parallel_rentals" name="max_parallel_rentals" type="number" min={0} className="field" defaultValue={rental.max_parallel_rentals} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="block_overdue" defaultChecked={rental.block_overdue} />
        Block new picks while a customer has overdue books
      </label>
    </ActionForm>
  );
}

export function WhatsappSettingsForm({ whatsapp }: { whatsapp: WhatsappSettings }) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save messages" pendingLabel="Saving…">
      <input type="hidden" name="key" value="whatsapp" />
      <input type="hidden" name="kind" value="whatsapp" />

      <div className="sm:max-w-xs">
        <label className="label" htmlFor="country_code">
          Country code
        </label>
        <input id="country_code" name="country_code" className="field" defaultValue={whatsapp.country_code} />
      </div>

      <div>
        <label className="label" htmlFor="renew_text">
          Renewal reminder — placeholders: {`{name}`} {`{plan}`} {`{expires}`} {`{days}`} {`{renew}`}
        </label>
        <textarea id="renew_text" name="renew_text" rows={3} className="field" defaultValue={whatsapp.renew_text} />
      </div>

      <div>
        <label className="label" htmlFor="order_text">
          Dispatch message — placeholders: {`{name}`} {`{books}`} {`{order}`} {`{tracking}`}
        </label>
        <textarea id="order_text" name="order_text" rows={3} className="field" defaultValue={whatsapp.order_text} />
      </div>
    </ActionForm>
  );
}

export function WarehouseSettingsForm({ warehouse }: { warehouse: WarehouseSettings }) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save warehouse" pendingLabel="Saving…">
      <input type="hidden" name="key" value="warehouse" />
      <input type="hidden" name="kind" value="warehouse" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="wh_name">
            Name on the return slip
          </label>
          <input id="wh_name" name="name" className="field" defaultValue={warehouse.name} />
        </div>
        <div>
          <label className="label" htmlFor="wh_phone">
            Phone on the return slip
          </label>
          <input id="wh_phone" name="phone" className="field" defaultValue={warehouse.phone} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="wh_address">
          Return address
        </label>
        <textarea id="wh_address" name="address" rows={3} className="field" defaultValue={warehouse.address} />
      </div>
    </ActionForm>
  );
}

export function DepositSettingsForm({ deposit }: { deposit: { amount: number; note: string } }) {
  return (
    <ActionForm action={saveSimpleSettingAction} submitLabel="Save deposit" pendingLabel="Saving…">
      <input type="hidden" name="key" value="deposit" />
      <input type="hidden" name="kind" value="deposit" />

      <div>
        <label className="label" htmlFor="amount">
          Refundable deposit (৳)
        </label>
        <input id="amount" name="amount" type="number" step="1" className="field sm:max-w-xs" defaultValue={deposit.amount} />
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
