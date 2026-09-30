import Link from "next/link";

import { LoginForm } from "@/components/auth-forms";
import { SetupNotice } from "@/components/ui";

export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? search.next : "/account";

  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Welcome back</h1>
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
        <Link href="/register" className="font-medium text-ink underline hover:text-gold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
