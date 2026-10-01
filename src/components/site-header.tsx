import Link from "next/link";

import { MobileMenu } from "@/components/mobile-menu";
import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/lib/nav-links";
import { ScrollElevation } from "@/components/motion";
import { SearchOverlay } from "@/components/search-overlay";
import { getSession } from "@/lib/auth";
import { getAnnouncement } from "@/lib/data";

export async function SiteHeader() {
  const [session, announcement] = await Promise.all([getSession(), getAnnouncement()]);

  return (
    <header
      data-site-header
      className="relative sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur transition-shadow duration-200 data-[scrolled=true]:shadow-[0_1px_0_#09090914,0_20px_34px_-28px_#09090973]"
    >
      <ScrollElevation />
      {announcement.enabled && announcement.text ? (
        <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-paper/90">
          {announcement.text}
        </div>
      ) : null}

      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <div className="flex items-center gap-9">
          <Link href="/" aria-label="REY BD — home" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rey-logo-black.svg"
              alt="REY BD"
              width={78}
              height={40}
              className="h-9 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                className="nav-link py-2 text-sm text-ink-soft transition hover:text-ink"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SearchOverlay />
          <Link
            href={session ? "/account" : "/login"}
            className="btn btn-ghost btn-sm hidden sm:inline-flex"
          >
            {session ? "My account" : "Sign in"}
          </Link>
          <Link href="/plans" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Start a plan
          </Link>
          <MobileMenu signedIn={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
