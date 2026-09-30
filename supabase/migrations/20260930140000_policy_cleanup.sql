-- =============================================================================
-- REY BD — 0005: finish the policy cleanup
--
-- 0004 split the `for all` admin policies into insert/update/delete, but two of
-- them were named differently in 0001 (`copies_admin`, `cms_admin`) so the drop
-- missed them, leaving the old catch-all policies in place alongside the new
-- ones. And on `rentals` / `order_items` the customer INSERT policy and the
-- admin INSERT policy now overlapped.
--
-- Both are correctness-neutral but make every query evaluate two policies, so
-- they are worth clearing. This merges each pair into a single policy.
--
-- Safe to re-run. Run AFTER 20260930130000_hardening.sql.
-- =============================================================================

-- 1. Remove the two stale catch-all policies that 0004 did not match by name.
drop policy if exists copies_admin on book_copies;
drop policy if exists cms_admin on cms_pages;

-- 2. One INSERT policy each instead of an admin one plus a customer one.
drop policy if exists order_items_admin_insert on order_items;
drop policy if exists order_items_customer_insert on order_items;
create policy order_items_insert on order_items
  for insert with check (
    (select public.is_admin())
    or exists (
      select 1 from orders o
       where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists rentals_admin_insert on rentals;
drop policy if exists rentals_customer_signup_insert on rentals;
create policy rentals_insert on rentals
  for insert with check (
    (select public.is_admin())
    or (
      user_id = (select auth.uid())
      and exists (
        select 1 from subscriptions s
         where s.id = subscription_id
           and s.user_id = (select auth.uid())
           and s.status = 'pending'
      )
    )
  );
