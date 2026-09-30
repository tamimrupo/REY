"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { rejectPaymentAction, verifyPaymentAction } from "@/lib/actions/admin";

export function PaymentReview({ paymentId }: { paymentId: string }) {
  const [verifyState, verifyAction] = useActionState(verifyPaymentAction, null);
  const [rejectState, rejectAction] = useActionState(rejectPaymentAction, null);

  return (
    <div className="space-y-3">
      <form action={verifyAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="payment_id" value={paymentId} />
        <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Verifying…">
          Verify &amp; activate
        </SubmitButton>
      </form>

      <details>
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
          Reject this payment
        </summary>
        <form action={rejectAction} className="mt-2 space-y-2">
          <input type="hidden" name="payment_id" value={paymentId} />
          <input
            name="reason"
            className="field"
            placeholder="Reason shown to the customer"
          />
          <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Rejecting…">
            Confirm rejection
          </SubmitButton>
        </form>
      </details>

      {verifyState ? (
        <Alert tone={verifyState.ok ? "success" : "error"}>{verifyState.message}</Alert>
      ) : null}
      {rejectState ? (
        <Alert tone={rejectState.ok ? "success" : "error"}>{rejectState.message}</Alert>
      ) : null}
    </div>
  );
}
