import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata = {
  title: "Reset password",
  description: "Reset your REY BD password — we will email you a secure link to choose a new one.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter your email and we will send you a link to set a new password.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/login" className="hover:text-gold">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
