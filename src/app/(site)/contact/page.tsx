import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";
import { SectionHeading } from "@/components/ui";
import { getSiteSettings } from "@/lib/data";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const site = await getSiteSettings();

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Contact"
        title="Talk to a human"
        description="Questions about a plan, a delivery or a book you cannot find? We answer every message, usually the same day."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Email
            </p>
            <a href={`mailto:${site.email}`} className="mt-2 block font-display text-xl text-ink hover:text-gold">
              {site.email}
            </a>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Phone &amp; WhatsApp
            </p>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-2 block font-display text-xl text-ink hover:text-gold">
              {site.phone}
            </a>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Warehouse
            </p>
            <p className="mt-2 text-ink-soft">{site.address}</p>
            <p className="mt-2 text-sm text-ink-muted">Open Saturday–Thursday, 10am–7pm.</p>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Looking for a specific book?
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Use the rare-book request form and we will try to source it for the club.
            </p>
            <Link href="/rare" className="btn btn-outline btn-sm mt-4">
              Request a book
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-ink">Get the monthly email</h2>
            <p className="mt-2 text-sm text-ink-soft">
              New arrivals, restocks and members-only offers. One email a month, no noise.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-ink">Common questions</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Can I change my plan?", "/p/faq"],
                ["How does the deposit work?", "/p/return-refund-deposit-policy"],
                ["Where do you deliver?", "/p/shipping-delivery-policy"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-soft hover:text-gold">
                    {label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
