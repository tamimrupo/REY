import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification, NotificationKind } from "@/lib/types";

/**
 * Email delivery is optional. Without RESEND_API_KEY every notification stays
 * in the outbox and the shop sends it from the dashboard with the WhatsApp
 * button — exactly how the WordPress plugin worked, minus the copy/paste.
 */
const RESEND_KEY = process.env.RESEND_API_KEY?.trim() || "";
const FROM = process.env.NOTIFY_FROM_EMAIL?.trim() || "REY BD <onboarding@resend.dev>";

export const emailConfigured = Boolean(RESEND_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) return { ok: false, error: "No email provider configured" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text: body }),
    });
    if (!response.ok) {
      return { ok: false, error: (await response.text()).slice(0, 400) };
    }
    return { ok: true };
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
    const result = await sendEmail(
      input.email,
      input.subject ?? "REY BD",
      input.body,
    );
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
