"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import type { ActionState } from "@/lib/actions/types";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Thin wrapper around `useActionState` that renders the returned message.
 * Keeps every CRUD form in the dashboard consistent.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className = "space-y-4",
  submitClassName = "btn btn-primary",
  footer,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  submitClassName?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className={submitClassName} pendingLabel={pendingLabel}>
          {submitLabel}
        </SubmitButton>
        {footer}
      </div>
    </form>
  );
}
