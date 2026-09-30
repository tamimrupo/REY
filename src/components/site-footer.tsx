import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";
import { getSiteSettings } from "@/lib/data";

const columns = [
  {
    title: "Rent & Read",
    links: [
      { href: "/library", label: "Browse Catalog" },
      { href: "/plans", label: "Subscription Plans" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/p/rental-rules", label: "Rental Rules" },
      { href: "/p/security-deposit-guide", label: "Security Deposit Guide" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/p/terms-conditions", label: "Terms & Conditions" },
      { href: "/p/privacy-policy", label: "Privacy Policy" },
      { href: "/p/return-refund-deposit-policy", label: "Return, Refund & Deposit Policy" },
      { href: "/p/shipping-delivery-policy", label: "Shipping & Delivery Policy" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about-us", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/account", label: "My Account" },
      { href: "/p/faq", label: "FAQ & Help Center" },
    ],
  },
];

export async function SiteFooter() {
  const site = await getSiteSettings();

  return (
    <footer className="mt-24 border-t border-line bg-ink text-paper/80">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/rey-logo-white.svg"
            alt="REY BD"
            width={78}
            height={40}
            className="h-9 w-auto"
          />
          <p className="mt-3 max-w-sm text-sm leading-relaxed">{site.tagline}</p>
          <p className="mt-6 text-sm leading-relaxed">
            {site.address}
            <br />
            {site.phone}
            <br />
            {site.email}
          </p>
          <div className="mt-6 flex gap-4 text-sm">
            {site.facebook ? (
              <a href={site.facebook} className="hover:text-paper">
                Facebook
              </a>
            ) : null}
            {site.instagram ? (
              <a href={site.instagram} className="hover:text-paper">
                Instagram
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="label-mono !text-paper/60">{column.title}</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="nav-link transition hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="lg:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-soft">
              Actually good emails, we swear
            </p>
            <p className="mt-2 text-sm">
              New arrivals, restocks and members-only offers. One email a month.
            </p>
          </div>
          <div className="w-full lg:max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} REY BD. All rights reserved.</p>
          <p>Secure payments · bKash · Nagad · Rocket</p>
        </div>
      </div>
    </footer>
  );
}
