"use client";

import Link from "next/link";

import { ActionForm } from "@/components/forms/action-form";
import {
  forgotPasswordAction,
  resendConfirmationAction,
  signInAction,
  signUpAction,
} from "@/lib/actions/auth";

export function LoginForm({ next = "/account" }: { next?: string }) {
  return (
    <ActionForm action={signInAction} submitLabel="Sign in" pendingLabel="Signing in…">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="field" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="field"
          autoComplete="current-password"
        />
      </div>
      <p className="mt-6 text-sm">
        <Link
          href="/forgot-password"
          className="inline-block py-1.5 text-ink-soft hover:text-gold"
        >
          Forgot your password?
        </Link>
      </p>
    </ActionForm>
  );
}

export function RegisterForm({ next = "/account" }: { next?: string }) {
  return (
    <ActionForm action={signUpAction} submitLabel="Create account" pendingLabel="Creating…">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="full_name">
          Full name
        </label>
        <input id="full_name" name="full_name" required className="field" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          className="field"
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="field" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="field"
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-ink-muted">At least 6 characters.</p>
      </div>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={forgotPasswordAction} submitLabel="Send reset link" pendingLabel="Sending…">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
          autoComplete="email"
        />
      </div>
    </ActionForm>
  );
}

/** Used on the "check your inbox" screen and as a fallback on the login page. */
export function ResendConfirmationForm({ email = "" }: { email?: string }) {
  return (
    <ActionForm
      action={resendConfirmationAction}
      submitLabel="Resend confirmation email"
      pendingLabel="Sending…"
      submitClassName="btn btn-outline"
    >
      <div>
        <label className="label" htmlFor="resend-email">
          Email
        </label>
        <input
          id="resend-email"
          name="email"
          type="email"
          required
          className="field"
          defaultValue={email}
        />
      </div>
    </ActionForm>
  );
}
