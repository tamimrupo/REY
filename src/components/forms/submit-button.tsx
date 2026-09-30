"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  formAction,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** Optional second action for the same form (e.g. "Preview" vs "Import"). */
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} formAction={formAction}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
