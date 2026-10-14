import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type { ExtractedLead, Language } from "./sales-agent/agent";

export type LeadStatus =
  | "new"
  | "qualified"
  | "converted"
  | "stopped"
  | "unresponsive";

export interface Lead {
  id: string;
  psid: string;
  name: string | null;
  phone: string | null;
  preferred_plan: string | null;
  status: LeadStatus;
  platform: string;
  language: string | null;
  follow_up_stage: number;
  created_at: string;
  last_contact_at: string;
}

/**
 * Upsert a lead on first contact and return whether it is brand-new. Every
 * inbound message refreshes `last_contact_at`; a lead that had been `stopped`
 * is reset to `new` (the "re-engage" path) so the cadence restarts.
 */
export async function upsertLeadOnContact(psid: string, language: Language): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  try {
    await supabase.from("leads").upsert(
      {
        psid,
        platform: "messenger",
        language,
        last_contact_at: now,
        // On conflict, only refresh last_contact_at + language; keep the rest.
        // `status`/`follow_up_stage` are handled below for the re-engage case.
      },
      { onConflict: "psid" },
    );

    // Re-engaged (was stopped) → restart the sequence.
    await supabase
      .from("leads")
      .update({ status: "new", follow_up_stage: 0, last_contact_at: now })
      .eq("psid", psid)
      .eq("status", "stopped");
  } catch (error) {
    console.error("[rey:leads] upsertLeadOnContact failed:", (error as Error).message);
  }
}

/**
 * Merge structured lead info (name / phone / plan) into the lead and promote
 * it to `qualified` once the lead has shared contact or plan details.
 */
export async function applyLeadInfo(
  psid: string,
  lead: ExtractedLead,
  language: Language,
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const patch: Record<string, unknown> = {
    language,
    last_contact_at: new Date().toISOString(),
  };
  if (lead.name) patch.name = lead.name;
  if (lead.phone) patch.phone = lead.phone;
  if (lead.plan) patch.preferred_plan = lead.plan;

  // Any contact/plan detail counts as qualification.
  if (lead.name || lead.phone || lead.plan) patch.status = "qualified";

  try {
    await supabase.from("leads").update(patch).eq("psid", psid);
  } catch (error) {
    console.error("[rey:leads] applyLeadInfo failed:", (error as Error).message);
  }
}

/**
 * Select leads that are due a follow-up. The daily cron walks the cadence by
 * `follow_up_stage` and the elapsed time since `last_contact_at`.
 */
export async function listFollowupsDue(): Promise<Lead[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const now = Date.now();
  const hoursSince = (iso: string) => (now - new Date(iso).getTime()) / 3_600_000;

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["new", "qualified", "unresponsive"])
    .in("follow_up_stage", [0, 1, 2]);

  if (error) {
    console.error("[rey:leads] follow-up query failed:", error.message);
    return [];
  }

  const due: Lead[] = [];
  for (const row of (data ?? []) as Lead[]) {
    const stage = row.follow_up_stage;
    const hours = hoursSince(row.last_contact_at);
    // Day 1 → ≥24h · Day 3 → ≥48h after Day 1 · Day 7 → ≥96h after Day 3.
    if (stage === 0 && hours >= 24) due.push(row);
    if (stage === 1 && hours >= 48) due.push(row);
    if (stage === 2 && hours >= 96) due.push(row);
  }
  return due;
}

/**
 * Advance a lead's follow-up stage after sending. Stage 3 (Day 7 sent) also
 * marks the lead `stopped` — the graceful exit, no further messages unless the
 * lead re-engages.
 */
export async function markFollowupSent(psid: string, stage: number): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    follow_up_stage: stage,
    last_contact_at: now,
  };
  if (stage >= 3) patch.status = "stopped";

  await supabase.from("leads").update(patch).eq("psid", psid);
}
