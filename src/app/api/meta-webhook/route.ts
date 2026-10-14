import { NextResponse, type NextRequest } from "next/server";

import { applyLeadInfo, upsertLeadOnContact } from "@/lib/leads";
import { sendMessage } from "@/lib/meta-messenger";
import { composeReply, detectLanguage } from "@/lib/sales-agent/agent";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = () => process.env.META_VERIFY_TOKEN?.trim() || "";

/**
 * GET — Meta webhook verification. Meta calls this once when Tamim clicks
 * "Verify and save" with the verify token; we echo `hub.challenge` back only
 * when `hub.verify_token` matches.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === VERIFY_TOKEN()) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

interface MessagingEvent {
  sender?: { id?: string };
  message?: {
    text?: string;
    is_echo?: boolean;
  };
}

/**
 * POST — inbound Messenger events. Handles `page` → `messages` (text). Echoes
 * (our own outgoing messages) and non-text events are ignored. Always returns
 * 200 so Meta does not retry; failures are logged, not surfaced.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const entries = (body as { object?: string; entry?: Array<{ messaging?: MessagingEvent[] }> })
    ?.entry;

  if ((body as { object?: string })?.object !== "page" || !Array.isArray(entries)) {
    return NextResponse.json({ ok: true, handled: 0 });
  }

  const replies: Array<{ psid: string; sent: boolean; text: string }> = [];

  for (const entry of entries) {
    for (const event of entry.messaging ?? []) {
      const psid = event.sender?.id;
      const text = event.message?.text?.trim();
      if (!psid || !text) continue;
      if (event.message?.is_echo) continue; // ignore the page's own outgoing echo

      const language = detectLanguage(text);

      // Record the contact (and reset a stopped lead that re-engaged).
      await upsertLeadOnContact(psid, language);

      // Compose the reply (LLM when configured, approved-script fallback).
      const result = await composeReply({ text });

      // Merge structured lead info (name / phone / plan) and qualify.
      await applyLeadInfo(psid, result.lead, language);

      const sent = await sendMessage(psid, result.reply);
      replies.push({ psid, sent: sent.ok, text: result.reply });
    }
  }

  return NextResponse.json({ ok: true, handled: replies.length, replies });
}
