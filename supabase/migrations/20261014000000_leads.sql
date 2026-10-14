-- =============================================================================
-- REY BD -- Messenger sales-bot leads
-- One row per Facebook Messenger conversation (keyed by Page-Scoped ID).
--
-- `status` lifecycle:
--   new         -> first inbound message, no qualification yet
--   qualified   -> lead shared a phone / plan / name (or a strong buying signal)
--   converted   -> signed up & paid (set by hand in Phase 1; no signup webhook)
--   unresponsive-> reserved for manual use (lead went cold mid-sequence)
--   stopped     -> Day-7 graceful exit reached; bot goes silent unless the lead
--                  re-engages (a re-engagement resets the lead to `new`).
--
-- `follow_up_stage` tracks where the lead sits in the follow-up cadence so the
-- daily cron is idempotent:
--   0 = hour-0 instant reply sent (initial)     -> due for Day 1
--   1 = Day 1 follow-up sent                     -> due for Day 3
--   2 = Day 3 follow-up sent                     -> due for Day 7
--   3 = Day 7 follow-up sent (then status=stopped)
--
-- The bot talks to Supabase through the service-role client (bypasses RLS);
-- clients get nothing. Safe to re-run.
-- =============================================================================

create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  psid             text not null unique,          -- Facebook Page-Scoped ID
  name             text,
  phone            text,
  preferred_plan   text,                          -- 'starter' | 'avid' | 'collector'
  status           text not null default 'new',   -- see lifecycle above
  platform         text not null default 'messenger',
  language         text,                          -- 'bn' | 'en' (follow-ups mirror it)
  follow_up_stage  int  not null default 0,
  created_at       timestamptz not null default now(),
  last_contact_at  timestamptz not null default now()
);

-- The daily cron selects by status + last_contact_at; keep that fast.
create index if not exists leads_status_last_contact_idx
  on leads (status, last_contact_at);

alter table leads enable row level security;
