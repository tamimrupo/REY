"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A link that knows whether it is the page you are on.
 *
 * It marks itself `aria-current="page"` — which screen readers announce and the
 * stylesheet underlines — so "where am I?" is answered on every navigation.
 * Prefix matching keeps a section lit while you are inside one of its children,
 * so `/library/1984` still marks `/library`.
 */
export function NavLink({
  href,
  className = "",
  children,
  onClick,
  exact = false,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** For menus that have to close themselves once the choice is made. */
  onClick?: () => void;
  /** For section roots like `/admin`, which would otherwise match everything under them. */
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    exact || href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
