import Link from "next/link";

import { RegisterForm } from "@/components/auth-forms";
import { SetupNotice } from "@/components/ui";

export const metadata = {
  title: "Create account",
  description:
    "Create a free REY BD account to pick your books, choose a plan and track deliveries across Bangladesh.",
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? search.next : "/account";

  return (
    <div>
      <h1 className="text-ink">Join the club</h1>
      <p className="mt-2 text-sm text-ink-soft">
        It is free to create an account. You only pay when you pick a plan.
      </p>

      <div className="mt-6">
        <SetupNotice />
      </div>

      <div className="mt-8">
        <RegisterForm next={next} />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-ink underline hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
