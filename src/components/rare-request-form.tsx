"use client";

import { ActionForm } from "@/components/forms/action-form";
import { requestBookAction } from "@/lib/actions/storefront";

export function RareRequestForm({ contactHint }: { contactHint?: string }) {
  return (
    <ActionForm
      action={requestBookAction}
      submitLabel="Send request"
      pendingLabel="Sending…"
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">
            Book title *
          </label>
          <input id="title" name="title" required className="field" placeholder="e.g. পুঁজি প্রথম খন্ড" />
        </div>
        <div>
          <label className="label" htmlFor="author">
            Author
          </label>
          <input id="author" name="author" className="field" placeholder="Karl Marx" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact">
          Phone or email {contactHint ? `(${contactHint})` : ""}
        </label>
        <input
          id="contact"
          name="contact"
          className="field"
          placeholder="So we can tell you when it arrives"
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Anything else?
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          className="field"
          placeholder="Edition, translation, ISBN, where you saw it…"
        />
      </div>
    </ActionForm>
  );
}
