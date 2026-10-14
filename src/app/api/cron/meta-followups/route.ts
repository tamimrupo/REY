import { NextResponse, type NextRequest } from "next/server";

import { getCronSecret } from "@/lib/data";
import { listFollowupsDue, markFollowupSent } from "@/lib/leads";
import { sendMessage } from "@/lib/meta-messenger";
import { FOLLOWUP_BY_STAGE } from "@/lib/sales-agent/scripts";

export const dynamic = "force-dynamic";

/**
 * Daily follow-up cron (see vercel.json). Sends Day 1 / Day 3 / Day 7 follow-ups
 * to leads that have gone quiet, mirroring each lead's language. After the Day 7
 * message the lead is marked `stopped` (graceful exit — the bot goes silent
 * unless the lead re-engages).
 *
 * Auth mirrors the maintenance cron: `getCronSecret()` from the `settings`
 * table, matched against the request secret / bearer token.
 */
export async function GET(request: NextRequest) {
  const provided =
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  const expected = await getCronSecret();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "No cron secret found." }, { status: 500 });
  }
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const due = await listFollowupsDue();
  const sent: Array<{ psid: string; stage: number; ok: boolean; error?: string }> = [];

  for (const lead of due) {
    const nextStage = lead.follow_up_stage + 1; // 1 → day1 · 2 → day3 · 3 → day7
    const script = FOLLOWUP_BY_STAGE[nextStage];
    if (!script) continue;

    const text = lead.language === "en" ? script.en : script.bn;
    const result = await sendMessage(lead.psid, text);

    if (result.ok) {
      await markFollowupSent(lead.psid, nextStage);
      sent.push({ psid: lead.psid, stage: nextStage, ok: true });
    } else {
      sent.push({ psid: lead.psid, stage: nextStage, ok: false, error: result.error });
    }
  }

  return NextResponse.json({ ok: true, due: due.length, sent });
}
