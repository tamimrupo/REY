import { supabaseConfigured } from "@/lib/env";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification, NotificationKind } from "@/lib/types";

/**
 * Email delivery is optional, and either provider works:
 *   - Resend  → set RESEND_API_KEY
 *   - Brevo   → set BREVO_API_KEY + BREVO_SENDER_EMAIL (the sender must be a
 *               verified sender in Brevo)
 *
 * Without either, notifications simply sit in the admin outbox and are sent by
 * hand over WhatsApp — which is how the original WordPress plugin worked.
 */
const RESEND_KEY = process.env.RESEND_API_KEY?.trim() || "";
const BREVO_KEY = process.env.BREVO_API_KEY?.trim() || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL?.trim() || "";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME?.trim() || "REY BD";
const FROM = process.env.NOTIFY_FROM_EMAIL?.trim() || "REY BD <onboarding@resend.dev>";

export type EmailProvider = "resend" | "brevo";

export const emailProvider: EmailProvider | null = RESEND_KEY
  ? "resend"
  : BREVO_KEY && BREVO_SENDER_EMAIL
    ? "brevo"
    : null;

export const emailConfigured = emailProvider !== null;

export function emailProviderLabel(): string {
  if (emailProvider === "resend") return "Resend";
  if (emailProvider === "brevo") return "Brevo";
  return "Not configured";
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Wraps a plain-text outbox message in the REY BD email shell so admin emails
 * match the branded auth emails (logo, monochrome card, footer).
 */
export function renderEmailHtml(body: string): string {
  const paragraphs = escapeHtml(body.trim())
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p style="margin:0 0 16px 0;">${chunk.replace(/\n/g, "<br />")}</p>`)
    .join("");
  if (!paragraphs) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;margin:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td style="padding:0 0 18px 4px;">
            <img src="${SITE_URL}/brand/rey-logo-black.png" alt="REY BD" width="96" height="49" style="display:block;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border:1px solid #e6e6e6;border-radius:8px;padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#3d3d3d;">
            ${paragraphs}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#8f8f8f;">
            <p style="margin:0 0 6px 0;">REY BD — rent books monthly, delivered anywhere in Bangladesh.</p>
            <p style="margin:0;">Questions? Just reply to this email or write to <a href="mailto:hello@rey.bd" style="color:#8f8f8f;">hello@rey.bd</a>.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#a3a3a3;">© ${new Date().getFullYear()} REY BD · <a href="${SITE_URL}" style="color:#a3a3a3;">rey.bd</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (emailProvider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to, subject, text: body, html: renderEmailHtml(body) }),
      });
      if (!response.ok) return { ok: false, error: (await response.text()).slice(0, 400) };
      return { ok: true };
    }

    if (emailProvider === "brevo") {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
          to: [{ email: to }],
          subject,
          textContent: body,
          htmlContent: renderEmailHtml(body),
        }),
      });
      if (!response.ok) return { ok: false, error: (await response.text()).slice(0, 400) };
      return { ok: true };
    }

    return { ok: false, error: "No email provider configured" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}

export type QueueNotificationInput = {
  userId?: string | null;
  kind: NotificationKind;
  subject?: string | null;
  body: string;
  phone?: string | null;
  email?: string | null;
  channel?: string;
  meta?: Record<string, unknown>;
  sendNow?: boolean;
};

/** Adds a row to the outbox, optionally sending the email immediately. */
export async function queueNotification(
  input: QueueNotificationInput,
): Promise<AppNotification | null> {
  if (!supabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId ?? null,
      kind: input.kind,
      channel: input.channel ?? (input.email && emailConfigured ? "email" : "whatsapp"),
      subject: input.subject ?? null,
      body: input.body,
      phone: input.phone ?? null,
      email: input.email ?? null,
      status: "queued",
      meta: input.meta ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[rey] could not queue notification:", error.message);
    return null;
  }

  if (input.sendNow && input.email && emailConfigured) {
    const result = await sendEmail(input.email, input.subject ?? "REY BD", input.body);
    await supabase
      .from("notifications")
      .update({
        status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
        error: result.error ?? null,
      })
      .eq("id", data.id);
    return { ...(data as AppNotification), status: result.ok ? "sent" : "failed" };
  }

  return data as AppNotification;
}
