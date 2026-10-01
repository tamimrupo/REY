import Link from "next/link";

import { LoginForm, ResendConfirmationForm } from "@/components/auth-forms";
import { SetupNotice } from "@/components/ui";

export const metadata = {
  title: "Sign in",
  description:
    "Sign in to REY BD to pick this month's books, follow your deliveries and manage your rental plan.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? search.next : "/account";

  return (
    <div>
      <h1 className="text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Sign in to pick this month&apos;s books and track your deliveries.
      </p>

      <div className="mt-6">
        <SetupNotice />
      </div>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        New to REY?{" "}
        <Link href="/register" className="font-medium text-ink underline hover:underline">
          Create an account
        </Link>
      </p>

      <details className="mt-6 rounded-card border border-line bg-white/60 p-4">
        <summary className="cursor-pointer py-1.5 text-sm text-ink-soft">
          Never got the confirmation email?
        </summary>
        <p className="mt-3 text-sm text-ink-soft">
          Accounts must be confirmed before the first sign-in. Send yourself a fresh link:
        </p>
        <div className="mt-4">
          <ResendConfirmationForm />
        </div>
      </details>
    </div>
  );
}
