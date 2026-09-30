"use client";

import { ActionForm } from "@/components/forms/action-form";
import { saveCustomerAction } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export function CustomerForm({ profile }: { profile: Profile }) {
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
          <span className="label">Account</span>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_blocked" defaultChecked={profile.is_blocked} />
            Block from placing new orders
          </label>
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
