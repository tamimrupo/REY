import Link from "next/link";

import { SendEmailButton } from "@/components/admin/notification-actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState, Stat, StatusPill } from "@/components/ui";
import { markNotificationDoneAction, runMaintenanceAction } from "@/lib/actions/admin";
import { ActionForm } from "@/components/forms/action-form";
import { getWhatsappSettings, listNotifications } from "@/lib/data";
import { emailConfigured, emailProviderLabel } from "@/lib/notify";
import { whatsappLink } from "@/lib/quotas";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Notifications" };

const FILTERS = [
  ["", "All"],
  ["queued", "Queued"],
  ["sent", "Sent"],
  ["manual", "Sent by hand"],
  ["failed", "Failed"],
];

export default async function AdminNotificationsPage(props: PageProps<"/admin/notifications">) {
  const search = await props.searchParams;
  const status = typeof search.status === "string" ? search.status : "";
  const [notifications, whatsapp] = await Promise.all([
    listNotifications(status || undefined),
    getWhatsappSettings(),
  ]);

  const queued = notifications.filter((n) => n.status === "queued").length;
  const withPhone = notifications.filter((n) => n.phone).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Renewal reminders, dispatch messages and overdue nudges. Send them by email, or tap
          WhatsApp and the message is pre-filled.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Waiting to send" value={queued} />
        <Stat label="With a phone number" value={withPhone} />
        <Stat
          label="Email delivery"
          value={emailConfigured ? "On" : "Off"}
          hint={
            emailConfigured
              ? `Sending via ${emailProviderLabel()}`
              : "Add BREVO_API_KEY or RESEND_API_KEY to send automatically"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/notifications?status=${value}` : "/admin/notifications"}
            className={`btn btn-sm ${status === value ? "btn-primary" : "btn-outline"}`}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto">
          <ActionForm
            action={runMaintenanceAction}
            submitLabel="Run maintenance now"
            pendingLabel="Running…"
            className=""
            submitClassName="btn btn-outline btn-sm"
          />
        </span>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Nothing to send"
          description="Run maintenance to queue renewal reminders, or verify a payment to queue dispatch messages."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const link = whatsappLink(notification.phone, notification.body, whatsapp.country_code);

            return (
              <div key={notification.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {notification.profiles?.full_name || "Customer"}
                      <span className="ml-2 font-normal capitalize text-ink-muted">
                        · {notification.kind}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatDateTime(notification.created_at)}
                      {notification.phone ? ` · ${notification.phone}` : " · no phone"}
                      {notification.email ? ` · ${notification.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={notification.status} />
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line rounded-card bg-cream/50 p-4 text-sm text-ink-soft">
                  {notification.body}
                </p>

                {notification.error ? (
                  <p className="mt-2 text-xs text-rose-600">{notification.error}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-gold btn-sm"
                    >
                      Open in WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-ink-muted">No phone number on file</span>
                  )}

                  <SendEmailButton id={notification.id} hasEmail={Boolean(notification.email)} />

                  {notification.status !== "sent" ? (
                    <form action={markNotificationDoneAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <input type="hidden" name="status" value="manual" />
                      <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="Marking…">
                        Mark as sent
                      </SubmitButton>
                    </form>
                  ) : null}

                  {notification.user_id ? (
                    <Link
                      href={`/admin/customers/${notification.user_id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Open customer
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
