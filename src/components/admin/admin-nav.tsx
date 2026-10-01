"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/subscriptions", label: "Subscriptions" },
      { href: "/admin/shipments", label: "Shipments" },
      { href: "/admin/rentals", label: "Books out" },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/deposits", label: "Deposits" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/requests", label: "Rare requests" },
      { href: "/admin/notifications", label: "Notifications" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/books", label: "Books" },
      { href: "/admin/authors", label: "Authors" },
      { href: "/admin/plans", label: "Plans" },
      { href: "/admin/import", label: "Import books" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/diagnostics", label: "Diagnostics" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/pages", label: "Pages" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="label-mono pl-3">{group.title}</p>
          <div className="mt-2 space-y-px">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block border-l-2 py-2 pl-3 text-sm transition-colors duration-150 ${
                    active
                      ? "border-l-ink font-medium text-ink"
                      : "border-l-transparent text-ink-soft hover:border-l-line hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
