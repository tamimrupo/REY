import Link from "next/link";

import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const session = await requireUser("/account");
  const name = session.profile?.full_name || session.email || "Member";
  const isStaff =
    session.profile?.role === "admin" || session.profile?.role === "staff";

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0">
          <div className="rounded-card border border-line bg-white p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Signed in as</p>
            <p className="mt-1 truncate font-display text-lg font-semibold text-ink">{name}</p>
            {session.email ? (
              <p className="mt-0.5 truncate text-xs text-ink-muted">{session.email}</p>
            ) : null}
          </div>

          <div className="mt-5">
            <AccountNav />
          </div>

          <div className="mt-6 space-y-2 border-t border-line pt-5">
            {isStaff ? (
              <Link href="/admin" className="btn btn-gold btn-sm w-full">
                Open dashboard
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-outline btn-sm w-full">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
