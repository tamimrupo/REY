"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { sendNotificationAction } from "@/lib/actions/admin";

export function SendEmailButton({ id, hasEmail }: { id: string; hasEmail: boolean }) {
  const [state, formAction] = useActionState(sendNotificationAction, null);

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Sending…">
          {hasEmail ? "Email it" : "Try email"}
        </SubmitButton>
      </form>
      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
    </div>
  );
}
