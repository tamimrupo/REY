"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/account", label: "Overview" },
  { href: "/account/membership", label: "Membership" },
  { href: "/account/box", label: "My box" },
  { href: "/account/books", label: "My books" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/payments", label: "Payments" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="no-scrollbar -mx-1 flex gap-5 overflow-x-auto border-b border-line lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-t lg:border-ink"
    >
      {items.map((item) => {
        const active =
          item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm transition-colors duration-150 lg:border-b-0 lg:border-l-2 lg:py-2 lg:pl-3 ${
              active
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink-soft hover:text-ink lg:hover:border-l-line"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
