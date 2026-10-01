import {
  AnnouncementForm,
  CourierSettingsForm,
  DepositSettingsForm,
  PaymentSettingsForm,
  RentalSettingsForm,
  SiteSettingsForm,
  WarehouseSettingsForm,
  WhatsappSettingsForm,
} from "@/components/admin/settings-forms";
import { ActionForm } from "@/components/forms/action-form";
import { Alert } from "@/components/ui";
import { runMaintenanceAction } from "@/lib/actions/admin";
import {
  getAnnouncement,
  getCourierSettings,
  getCronSecret,
  getPaymentSettings,
  getRentalSettings,
  getSetting,
  getSiteSettings,
  getWarehouseSettings,
  getWhatsappSettings,
} from "@/lib/data";
import { emailConfigured, emailProviderLabel } from "@/lib/notify";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [site, announcement, payments, couriers, rental, whatsapp, warehouse, deposit, secret] =
    await Promise.all([
      getSiteSettings(),
      getAnnouncement(),
      getPaymentSettings(),
      getCourierSettings(),
      getRentalSettings(),
      getWhatsappSettings(),
      getWarehouseSettings(),
      getSetting("deposit", { amount: 500, refundable: true, note: "" }),
      getCronSecret(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Store details, payment numbers, courier rates, rental rules and message templates.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Rental rules</h2>
        <p className="mt-1 text-sm text-ink-soft">
          How long a month lasts, when to remind members, and whether overdue books block new picks.
        </p>
        <div className="mt-6">
          <RentalSettingsForm rental={rental} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Courier rates &amp; cost sharing</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Set the real courier charge and the share the customer pays. A swap costs one trip: new
          books out and old books back together.
        </p>
        <div className="mt-6">
          <CourierSettingsForm couriers={couriers} />
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
        <h2 className="text-lg font-semibold text-ink">Security deposit</h2>
        <div className="mt-6">
          <DepositSettingsForm deposit={deposit} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">WhatsApp &amp; email templates</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Renewal reminders and dispatch messages. Everything lands in the Notifications outbox with
          a ready-to-send WhatsApp link.
        </p>
        <div className="mt-6">
          <WhatsappSettingsForm whatsapp={whatsapp} />
        </div>
        <div className="mt-4">
          {emailConfigured ? (
            <Alert tone="success">
              Email sending is on via <strong>{emailProviderLabel()}</strong>. Queued messages can be
              emailed straight from the outbox.
            </Alert>
          ) : (
            <Alert tone="info">
              Email is optional. Add <code className="rounded bg-white/60 px-1">BREVO_API_KEY</code>{" "}
              + <code className="rounded bg-white/60 px-1">BREVO_SENDER_EMAIL</code> (or{" "}
              <code className="rounded bg-white/60 px-1">RESEND_API_KEY</code>) to email
              notifications; otherwise send from the outbox with one click on WhatsApp. See the
              README for the Brevo setup.
            </Alert>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Warehouse / return address</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Printed on the BD Post return slip so members can send books back for free.
        </p>
        <div className="mt-6">
          <WarehouseSettingsForm warehouse={warehouse} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Store details</h2>
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
        <h2 className="text-lg font-semibold text-ink">Daily maintenance</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Expires finished plans and queues renewal reminders. Vercel runs this automatically every
          day at 03:00 Dhaka time; you can also run it now.
        </p>
        <div className="mt-6">
          <ActionForm
            action={runMaintenanceAction}
            submitLabel="Run maintenance now"
            pendingLabel="Running…"
            className="space-y-4"
          />
        </div>

        <div className="mt-6 rounded-card border border-line bg-cream/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Cron secret
          </p>
          <p className="mt-2 break-all font-mono text-xs text-ink-soft">{secret || "—"}</p>
          <p className="mt-2 text-xs text-ink-muted">
            Add it to Vercel as <code className="font-mono">CRON_SECRET</code>. The endpoint is{" "}
            <code className="font-mono">/api/cron/maintenance</code>.
          </p>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Deployment checklist</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-soft">
          <li>
            1. Run the three SQL files in <code className="font-mono">supabase/migrations</code> in
            order (init → seed → rentals), or run <code className="font-mono">supabase db push</code>
            .
          </li>
          <li>2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel.</li>
          <li>
            3. Promote yourself:{" "}
            <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs">
              update profiles set role = &apos;admin&apos; where id = (select id from auth.users where
              email = &apos;you@example.com&apos;);
            </code>
          </li>
          <li>4. Copy the cron secret above into Vercel as CRON_SECRET.</li>
          <li>5. Point your domain at Vercel and set NEXT_PUBLIC_SITE_URL.</li>
        </ol>
      </section>
    </div>
  );
}
