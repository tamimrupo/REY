import {
  AnnouncementForm,
  DeliverySettingsForm,
  DepositSettingsForm,
  PaymentSettingsForm,
  SiteSettingsForm,
} from "@/components/admin/settings-forms";
import {
  getAnnouncement,
  getDeliverySettings,
  getPaymentSettings,
  getSetting,
  getSiteSettings,
} from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [site, announcement, payments, delivery, deposit] = await Promise.all([
    getSiteSettings(),
    getAnnouncement(),
    getPaymentSettings(),
    getDeliverySettings(),
    getSetting("deposit", { amount: 500, refundable: true, note: "" }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Store details, the announcement bar, payment numbers, courier fees and the deposit.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Store details</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Used in the header, footer and contact page.
        </p>
        <div className="mt-6">
          <SiteSettingsForm site={site} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Announcement bar</h2>
        <div className="mt-6">
          <AnnouncementForm announcement={announcement} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Manual payments</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Customers send money to these numbers and submit the TrxID for your approval.
        </p>
        <div className="mt-6">
          <PaymentSettingsForm payments={payments} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Couriers &amp; delivery fees</h2>
        <div className="mt-6">
          <DeliverySettingsForm delivery={delivery} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Security deposit</h2>
        <div className="mt-6">
          <DepositSettingsForm deposit={deposit} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Deployment checklist</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-soft">
          <li>1. Run the SQL in supabase/migrations to create tables, policies and seed data.</li>
          <li>2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel.</li>
          <li>
            3. Promote yourself:{" "}
            <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs">
              update profiles set role = &apos;admin&apos; where id = (select id from auth.users where
              email = &apos;you@example.com&apos;);
            </code>
          </li>
          <li>4. Point your domain at Vercel and set NEXT_PUBLIC_SITE_URL.</li>
        </ol>
      </section>
    </div>
  );
}
