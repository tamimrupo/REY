"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { submitPaymentAction } from "@/lib/actions/storefront";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/format";
import type { PaymentMethodInfo } from "@/lib/types";

export function PaymentForm({
  orderId,
  amount,
  userId,
  methods,
}: {
  orderId: string;
  amount: number;
  userId: string;
  methods: PaymentMethodInfo[];
}) {
  const [state, formAction] = useActionState(submitPaymentAction, null);
  const [method, setMethod] = useState(methods[0]?.key ?? "bkash");
  const [proofPath, setProofPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const active = methods.find((m) => m.key === method) ?? methods[0];

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      setProofPath(path);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Upload failed. You can still submit the TrxID.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="screenshot_url" value={proofPath} />

      <div>
        <span className="label">Payment method</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {methods.map((option) => (
            <button
              type="button"
              key={option.key}
              onClick={() => setMethod(option.key)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                method === option.key
                  ? "border-ink bg-cream/70 ring-2 ring-ink"
                  : "border-line hover:border-ink/40"
              }`}
            >
              <span className="block font-semibold text-ink">{option.label}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{option.number}</span>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div className="rounded-xl border border-line bg-cream/50 p-4 text-sm">
          <p className="text-ink">
            Send <span className="font-semibold">{money(amount)}</span> to{" "}
            <span className="font-semibold text-ink">
              {active.number}
            </span>{" "}
            ({active.label} · {active.type}) using the <em>Send Money</em> option.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            Then copy the TrxID from your confirmation SMS and paste it below.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sender_number">
            Your number (optional)
          </label>
          <input
            id="sender_number"
            name="sender_number"
            className="field"
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label className="label" htmlFor="trx_id">
            Transaction ID (TrxID) *
          </label>
          <input id="trx_id" name="trx_id" required className="field" placeholder="8N7A2K9LQ1" />
        </div>
      </div>

      <div>
        <span className="label">Payment screenshot (optional)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
          className="field file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-medium"
        />
        {uploading ? <p className="mt-2 text-xs text-ink-muted">Uploading…</p> : null}
        {proofPath && !uploading ? (
          <p className="mt-2 text-xs text-emerald-700">Screenshot attached.</p>
        ) : null}
        {uploadError ? <p className="mt-2 text-xs text-rose-600">{uploadError}</p> : null}
      </div>

      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <SubmitButton pendingLabel="Submitting…">Submit payment for verification</SubmitButton>
    </form>
  );
}
