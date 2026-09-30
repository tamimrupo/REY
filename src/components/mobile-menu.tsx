import Link from "next/link";

const links = [
  { href: "/plans", label: "Plans" },
  { href: "/library", label: "Library" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/rare", label: "Rare & requests" },
  { href: "/about-us", label: "About" },
];

export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  return (
    <details className="group relative md:hidden">
      <summary className="list-none">
        <span className="btn btn-outline btn-sm">
          Menu
          <span aria-hidden className="group-open:hidden">
            ☰
          </span>
          <span aria-hidden className="hidden group-open:inline">
            ✕
          </span>
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-xl">
        <nav className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-cream hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-line" />
          <Link
            href={signedIn ? "/account" : "/login"}
            className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-cream hover:text-ink"
          >
            {signedIn ? "My account" : "Sign in"}
          </Link>
          <Link href="/plans" className="btn btn-primary m-1">
            Start a plan
          </Link>
        </nav>
      </div>
    </details>
  );
}

export { links as navLinks };
