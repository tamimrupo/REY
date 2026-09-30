import Link from "next/link";

import { MobileMenu, navLinks } from "@/components/mobile-menu";
import { SearchOverlay } from "@/components/search-overlay";
import { getSession } from "@/lib/auth";
import { getAnnouncement } from "@/lib/data";

export async function SiteHeader() {
  const [session, announcement] = await Promise.all([getSession(), getAnnouncement()]);

  return (
    <header className="relative sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      {announcement.enabled && announcement.text ? (
        <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-paper/90">
          {announcement.text}
        </div>
      ) : null}

      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="REY BD — home" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rey-logo-black.svg"
              alt="REY BD"
              width={78}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-soft transition hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SearchOverlay />
          <Link
            href={session ? "/account" : "/login"}
            className="btn btn-ghost btn-sm hidden sm:inline-flex"
          >
            {session ? (session.profile?.full_name?.split(" ")[0] ?? "Account") : "Sign in"}
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
