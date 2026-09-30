-- =============================================================================
-- REY BD — 0007: let direct database access through the customer guards
--
-- The guard triggers exist to stop a *signed-in customer* from writing fields
-- they should not own (role, is_blocked, order/payment status). They checked
-- `not public.is_admin()`, but when you run SQL directly — the Supabase SQL
-- Editor, `psql`, the service role, the MCP — there is no JWT at all, so
-- `auth.uid()` is NULL and `is_admin()` is false.
--
-- The result: `update profiles set role = 'admin' ...` from the SQL Editor was
-- silently reverted, which broke the documented setup step.
--
-- Fix: the guards now only apply when there IS an authenticated user who is not
-- an admin. That is exactly the untrusted case. Direct database access is
-- trusted by definition and is left alone.
--
-- Safe to re-run. Run AFTER 20260930150000_function_privileges.sql.
-- =============================================================================

-- 1. Profile guard: role + is_blocked.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is NULL for the SQL Editor, psql, the service role and the MCP.
  -- Only a real signed-in non-admin is untrusted.
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- 2. Insert guard: orders, payments, rentals.
create or replace function public.guard_customer_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  quota int;
  used  int;
begin
  if coalesce(current_setting('rey.system', true), '') = 'on' then
    return new;
  end if;
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'orders' then
    new.status := 'pending_payment';
    if new.type = 'delivery_fee' then
      new.subtotal := public.courier_customer_charge(
        coalesce(new.courier, 'steadfast'), coalesce(new.trip_type, 'outbound'));
      new.delivery_fee := new.subtotal;
      new.deposit_amount := 0;
      new.discount := 0;
      new.total := new.subtotal;
    end if;
  elsif tg_table_name = 'payments' then
    new.status := 'pending';
    new.verified_by := null;
    new.verified_at := null;
    new.reject_reason := null;
  elsif tg_table_name = 'rentals' then
    new.status := 'pending';
    new.copy_id := null;
    new.checked_out_at := null;
    new.returned_at := null;
    new.lost_at := null;
    select coalesce(b.replacement_value, 0) into new.replacement_value
      from books b where b.id = new.book_id;

    select p.books_per_month into quota
      from subscriptions s join plans p on p.id = s.plan_id
     where s.id = new.subscription_id;
    select count(*) into used from rentals r where r.subscription_id = new.subscription_id;
    if quota is not null and used >= quota then
      raise exception 'That is more books than your plan allows.';
    end if;
  end if;

  return new;
end;
$$;

-- 3. Update guard: subscriptions.
create or replace function public.guard_customer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('rey.system', true), '') = 'on' then
    return new;
  end if;
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'subscriptions' then
    -- The only self-service change is cancelling.
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      new.status := old.status;
    end if;
    new.plan_id := old.plan_id;
    new.started_at := old.started_at;
    new.current_period_start := old.current_period_start;
    new.current_period_end := old.current_period_end;
    new.next_billing_date := old.next_billing_date;
  end if;

  return new;
end;
$$;
