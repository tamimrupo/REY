import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { NavLink } from "@/components/nav-link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  const name = session.profile?.full_name || session.email || "Staff";
  const role = session.profile?.role ?? "staff";

  return (
    <div className="min-h-screen bg-cream/40">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[110rem] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3" aria-label="REY dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/rey-logo-black.svg"
                alt="REY"
                width={78}
                height={40}
                className="h-6 w-auto"
              />
              <span className="label-mono">
                Dashboard
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{name}</p>
              <p className="text-xs capitalize text-ink-muted">{role}</p>
            </div>
            <Link href="/" className="btn btn-outline btn-sm">
              View site
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[110rem] gap-8 px-5 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <AdminNav />
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1">
          {/* Horizontal nav for small screens */}
          <div className="no-scrollbar mb-6 -mx-1 overflow-x-auto border-b border-line lg:hidden">
            <div className="flex gap-5 px-1">
              {[
                ["/admin", "Overview"],
                ["/admin/orders", "Orders"],
                ["/admin/subscriptions", "Subs"],
                ["/admin/payments", "Payments"],
                ["/admin/customers", "Customers"],
                ["/admin/books", "Books"],
                ["/admin/settings", "Settings"],
              ].map(([href, label]) => (
                <NavLink
                  key={href}
                  href={href}
                  exact={href === "/admin"}
                  className="whitespace-nowrap border-b-2 border-transparent pb-2.5 pt-1 text-sm text-ink-soft transition-colors duration-150 hover:text-ink aria-[current=page]:border-ink aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
