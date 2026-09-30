"use client";

import { ActionForm } from "@/components/forms/action-form";
import {
  updatePasswordAction,
  updateProfileAction,
} from "@/lib/actions/auth";
import { cancelMySubscriptionAction } from "@/lib/actions/storefront";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string | null }) {
  return (
    <ActionForm action={updateProfileAction} submitLabel="Save profile" pendingLabel="Saving…">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            className="field"
            defaultValue={profile?.full_name ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" className="field" defaultValue={profile?.phone ?? ""} />
        </div>
      </div>

      <div>
        <span className="label">Email</span>
        <input className="field bg-cream/60" value={email ?? ""} readOnly disabled />
        <p className="mt-1 text-xs text-ink-muted">
          Email changes are handled by support for now.
        </p>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={updatePasswordAction} submitLabel="Change password" pendingLabel="Saving…">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm password
          </label>
          <input id="confirm" name="confirm" type="password" required minLength={6} className="field" />
        </div>
      </div>
    </ActionForm>
  );
}

export function CancelMembershipForm({
  subscriptionId,
  planName,
}: {
  subscriptionId: string;
  planName: string;
}) {
  return (
    <details className="rounded-xl border border-line bg-cream/40 p-5">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        Cancel my {planName} membership
      </summary>
      <div className="mt-4">
        <p className="text-sm text-ink-soft">
          Cancelling stops future monthly charges. Return any books you still have and we will
          refund your deposit within 7 working days.
        </p>
        <div className="mt-4">
          <ActionForm
            action={cancelMySubscriptionAction}
            submitLabel="Confirm cancellation"
            pendingLabel="Cancelling…"
            submitClassName="btn btn-outline"
          >
            <input type="hidden" name="subscription_id" value={subscriptionId} />
            <div>
              <label className="label" htmlFor="reason">
                Anything we could do better? (optional)
              </label>
              <textarea id="reason" name="reason" rows={2} className="field" />
            </div>
          </ActionForm>
        </div>
      </div>
    </details>
  );
}
