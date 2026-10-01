import Link from "next/link";

import { ResendConfirmationForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";
import { siteUrl } from "@/lib/env";

export const metadata = {
  title: "Confirm your email",
  description: "Confirm your REY BD email address to finish setting up your book rental account.",
};

export default async function VerifyEmailPage(props: PageProps<"/verify-email">) {
  const search = await props.searchParams;
  const email = typeof search.email === "string" ? search.email : "";

  return (
    <div>
      <p className="eyebrow">One step left</p>
      <h1 className="mt-3 text-3xl font-semibold text-ink">Confirm your email</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We sent a confirmation link
        {email ? (
          <>
            {" "}
            to <span className="font-medium text-ink">{email}</span>
          </>
        ) : null}
        . Open it and you will be signed in automatically.
      </p>

      <ol className="mt-6 space-y-2 text-sm text-ink-soft">
        <li>1. Open your inbox and find the email from REY BD.</li>
        <li>2. Click the confirmation link — it signs you in and takes you to your account.</li>
        <li>3. Not there? Check your spam folder, then resend below.</li>
      </ol>

      <div className="mt-8">
        <ResendConfirmationForm email={email} />
      </div>

      <div className="mt-6 space-y-3">
        <Alert tone="info">
          <p className="font-medium">Email can be slow, or land in spam.</p>
          <p className="mt-1">
            If the link does not arrive within a few minutes, resend it once — or{" "}
            <Link href="/contact" className="underline">
              contact us
            </Link>{" "}
            and we will confirm you by hand.
          </p>
        </Alert>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Already confirmed?{" "}
        <Link href="/login" className="font-medium text-ink underline hover:text-gold">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-xs text-ink-muted">
        The link points at <span className="font-mono">{siteUrl}</span>. If you deploy to a real
        domain, add it to Supabase → Authentication → URL Configuration or the link will bounce.
      </p>
    </div>
  );
}
