-- =============================================================================
-- REY BD — 0006: revoke the implicit PUBLIC grant on functions
--
-- 0004 revoked EXECUTE from `anon`, but that had no effect: PostgreSQL grants
-- EXECUTE on new functions to PUBLIC by default, and `anon` inherits it from
-- there. To actually close a function you must revoke it FROM PUBLIC and then
-- hand EXECUTE to exactly the roles that need it.
--
-- After this migration:
--   * signed-out visitors (anon)  -> is_admin, courier_customer_charge, run_maintenance
--   * signed-in users             -> the customer RPCs above, plus dashboard stats
--   * nobody (via the API)        -> trigger functions
--
-- Safe to re-run. Run AFTER 20260930140000_policy_cleanup.sql.
-- =============================================================================

-- 1. Strip the default PUBLIC grant from every function we own.
--    `rls_auto_enable()` is Supabase's own helper and is left untouched.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname <> 'rls_auto_enable'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.signature);
  end loop;
end $$;

-- 2. Grant back exactly what each role legitimately needs.

-- Needed inside RLS policy expressions, so every caller must be able to run it.
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Pricing helper: the storefront quotes courier fees before checkout.
grant execute on function public.courier_customer_charge(text, text) to anon, authenticated, service_role;

-- Called by the Vercel cron job with the anon key; gated by the cron secret.
grant execute on function public.run_maintenance(text) to anon, authenticated, service_role;

-- Signed-in only: each of these checks `auth.uid()` and its own rules in SQL,
-- so they are safe to expose but pointless for a signed-out visitor.
grant execute on function public.add_to_box(uuid) to authenticated, service_role;
grant execute on function public.remove_from_box(uuid) to authenticated, service_role;
grant execute on function public.confirm_box(text, uuid) to authenticated, service_role;
grant execute on function public.request_return(text, text, uuid) to authenticated, service_role;
grant execute on function public.request_deposit_refund() to authenticated, service_role;
grant execute on function public.admin_dashboard_stats() to authenticated, service_role;

-- Trigger functions (handle_new_user, prevent_role_escalation,
-- guard_customer_insert, guard_customer_update) are deliberately left with no
-- grants: Postgres checks EXECUTE when a trigger is CREATEd, never when it
-- fires, so they keep working while being unreachable over the API.

-- 3. Make future functions start locked down instead of world-executable, so
--    this mistake cannot repeat. Every new function must be granted explicitly.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
