"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { repairOrderAction } from "@/lib/actions/admin";

export function RepairButton({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(repairOrderAction, null);

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="order_id" value={orderId} />
        <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Repairing…">
          Repair
        </SubmitButton>
      </form>
      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
    </div>
  );
}
