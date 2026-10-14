/**
 * Facebook Messenger send helpers for the sales bot (distinct from `meta.ts`,
 * which is the Conversions API). Sending is the ONLY outbound action here —
 * the bot never subscribes a page or a webhook; that is a manual human step in
 * the Meta app dashboard.
 */

const META_GRAPH_VERSION = "v26.0";

const PAGE_TOKEN = () => process.env.META_PAGE_TOKEN?.trim() || "";

/** True when a page access token is present — the bot is otherwise read-only. */
export const messengerConfigured = Boolean(PAGE_TOKEN());

export interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a plain-text message to a Messenger recipient (PSID) as the page.
 * No-op with a logged warning when the page token is not configured, so the
 * webhook can still be verified and tested before secrets are wired up.
 */
export async function sendMessage(psid: string, text: string): Promise<SendResult> {
  const token = PAGE_TOKEN();
  if (!token) {
    console.warn("[rey:messenger] META_PAGE_TOKEN not set — message not sent.");
    return { ok: false, error: "META_PAGE_TOKEN not configured" };
  }

  const url =
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me/messages` +
    `?access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text },
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
      console.error(`[rey:messenger] send failed for ${psid}: ${err}`);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error(`[rey:messenger] send error for ${psid}:`, message);
    return { ok: false, error: message };
  }
}
