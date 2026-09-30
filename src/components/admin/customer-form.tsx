"use client";

import { ActionForm } from "@/components/forms/action-form";
import { messageCustomerAction, saveCustomerAction } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export function CustomerForm({
  profile,
  couriers,
}: {
  profile: Profile;
  couriers: { key: string; label: string }[];
}) {
  return (
    <ActionForm action={saveCustomerAction} submitLabel="Save customer" pendingLabel="Saving…">
      <input type="hidden" name="id" value={profile.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input id="full_name" name="full_name" className="field" defaultValue={profile.full_name ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" className="field" defaultValue={profile.phone ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="role">
            Role
          </label>
          <select id="role" name="role" className="field" defaultValue={profile.role}>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1 text-xs text-ink-muted">
            Staff and admins can open this dashboard.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="courier_preference">
            Preferred courier
          </label>
          <select
            id="courier_preference"
            name="courier_preference"
            className="field"
            defaultValue={profile.courier_preference ?? "steadfast"}
          >
            {couriers.map((courier) => (
              <option key={courier.key} value={courier.key}>
                {courier.label}
              </option>
            ))}
          </select>
          <span className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_blocked" defaultChecked={profile.is_blocked} />
            Block from placing new orders
          </span>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Internal notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="field"
          defaultValue={profile.notes ?? ""}
          placeholder="Damaged a book, prefers phone calls, repeat customer…"
        />
      </div>
    </ActionForm>
  );
}

/** One-off message to this customer; lands in the Notifications outbox. */
export function MessageCustomerForm({ userId }: { userId: string }) {
  return (
    <ActionForm
      action={messageCustomerAction}
      submitLabel="Add to outbox"
      pendingLabel="Saving…"
      submitClassName="btn btn-outline btn-sm"
      className="space-y-3"
    >
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <label className="label" htmlFor="msg_subject">
          Subject (used for email)
        </label>
        <input id="msg_subject" name="subject" className="field" placeholder="About your return" />
      </div>
      <div>
        <label className="label" htmlFor="msg_body">
          Message
        </label>
        <textarea id="msg_body" name="body" rows={3} className="field" required />
      </div>
    </ActionForm>
  );
}
