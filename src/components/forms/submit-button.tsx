"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  formAction,
  formNoValidate,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** Optional second action for the same form (e.g. "Preview" vs "Import"). */
  formAction?: (formData: FormData) => void | Promise<void>;
  /** For a second submit in the same form that must bypass HTML validation. */
  formNoValidate?: boolean;
  /** For buttons that carry their own payload, e.g. a row id. */
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      name={name}
      value={value}
    >
      {pending ? (
        <>
          <span aria-hidden className="spinner" />
          {pendingLabel ?? "Working…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
