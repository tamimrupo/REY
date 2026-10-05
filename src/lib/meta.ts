import "server-only";

import { createHash } from "node:crypto";

/**
 * Meta (Facebook / Instagram) Conversions API.
 *
 * The browser pixel records what happens on the page; this records what
 * happens in the database — a sign-up, a payment the admin just verified —
 * so the ads still learn from it when the pixel was blocked. Meta counts the
 * two sides once as long as they share an `eventId`.
 *
 * Dormant until NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN are set.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE?.trim() || "";
const API_VERSION = "v23.0";

export const metaCapiConfigured = Boolean(/^\d{10,20}$/.test(PIXEL_ID) && TOKEN);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Meta wants the SHA-256 of a trimmed, lower-cased email. */
function hashEmail(email: string | null | undefined): string | null {
  const clean = email?.trim().toLowerCase();
  return clean ? sha256(clean) : null;
}

/** …and digits only for a phone, in international form (BD: 88017…). */
function hashPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) {
    // already international
  } else if (digits.startsWith("0")) {
    digits = `88${digits}`;
  } else if (digits.length >= 10) {
    digits = `880${digits}`;
  } else {
    return null;
  }
  return sha256(digits);
}

export type MetaServerEvent = {
  /** A Meta standard event, e.g. Purchase or CompleteRegistration. */
  name: string;
  /** Shared with the browser pixel when both sides send the same moment. */
  eventId: string;
  email?: string | null;
  phone?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  value?: number;
  currency?: string;
  contentName?: string;
};

/**
 * Posts one event to the Conversions API.
 *
 * Never throws: a failed report is a warning in the logs, never a failed
 * sign-up or a failed payment. Call it inside `after()` so the response is
 * not held up by the ad network.
 */
export async function sendMetaEvent(event: MetaServerEvent): Promise<void> {
  if (!metaCapiConfigured) return;

  const userData: Record<string, unknown> = {};
  const email = hashEmail(event.email);
  if (email) userData.em = [email];
  const phone = hashPhone(event.phone);
  if (phone) userData.ph = [phone];
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  if (event.clientIp) userData.client_ip_address = event.clientIp;
  if (event.userAgent) userData.client_user_agent = event.userAgent;

  const customData: Record<string, unknown> = {};
  if (typeof event.value === "number" && Number.isFinite(event.value)) {
    customData.value = event.value;
  }
  if (event.currency) customData.currency = event.currency;
  if (event.contentName) customData.content_name = event.contentName;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[rey] Meta ${event.name} rejected: ${response.status} ${text.slice(0, 200)}`);
    }
  } catch (error) {
    console.warn(`[rey] Meta ${event.name} failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}
