"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { subscribeNewsletterAction } from "@/lib/actions/storefront";

export function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeNewsletterAction, null);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="field sm:flex-1"
        />
        <SubmitButton className="btn btn-primary" pendingLabel="Joining…">
          Join
        </SubmitButton>
      </form>
      {state ? (
        <div className="mt-3">
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        </div>
      ) : null}
    </div>
  );
}
