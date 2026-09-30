-- =============================================================================
-- REY BD — 0004: hardening
--
-- Works through every finding from Supabase's security and performance advisors:
--
--   1. Index every foreign key (Postgres does not do this for you) plus a few
--      partial indexes for the hot paths (open rentals, trips to dispatch).
--   2. Rewrite RLS policies so `auth.uid()` / `is_admin()` are wrapped in a
--      subquery. Without this they are re-evaluated for EVERY row scanned;
--      wrapped, they become a one-time InitPlan (5-10x on big tables).
--   3. Split the `for all` admin policies into insert/update/delete, which
--      removes the overlapping-policy penalty. Admins keep SELECT via the
--      existing read policies (they all already allow `is_admin()`).
--   4. Revoke EXECUTE on trigger-only functions and on the customer RPCs for
--      the `anon` role, so a signed-out visitor cannot reach them.
--
-- Safe to re-run. Run AFTER 20260930120200_rentals_shipments.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Foreign key indexes
-- -----------------------------------------------------------------------------
create index if not exists deposits_subscription_idx       on deposits (subscription_id);
create index if not exists order_items_book_idx            on order_items (book_id);
create index if not exists order_items_order_idx           on order_items (order_id);
create index if not exists orders_address_idx              on orders (address_id);
create index if not exists orders_subscription_idx         on orders (subscription_id);
create index if not exists payments_order_idx              on payments (order_id);
create index if not exists payments_verified_by_idx        on payments (verified_by);
create index if not exists plan_features_plan_idx          on plan_features (plan_id);
create index if not exists rare_requests_user_idx          on rare_requests (user_id);
create index if not exists rentals_copy_idx                on rentals (copy_id);
create index if not exists rentals_order_idx               on rentals (order_id);
create index if not exists rentals_subscription_idx        on rentals (subscription_id);
create index if not exists shipments_address_idx           on shipments (address_id);
create index if not exists shipments_order_idx             on shipments (order_id);
create index if not exists shipments_subscription_idx      on shipments (subscription_id);
create index if not exists subscriptions_plan_idx          on subscriptions (plan_id);

-- Hot paths. Open rentals are queried on every box view and quota check.
create index if not exists rentals_open_idx
  on rentals (subscription_id, status)
  where status in ('pending', 'out', 'returning');

create index if not exists rentals_overdue_idx
  on rentals (user_id, due_at)
  where status in ('out', 'returning');

-- Trips waiting to leave the warehouse, and the notification outbox.
create index if not exists shipments_open_idx
  on shipments (type, status)
  where status in ('pending', 'awaiting_post', 'packed');

create index if not exists notifications_queued_idx
  on notifications (created_at desc)
  where status = 'queued';

-- -----------------------------------------------------------------------------
-- 2 + 3. Policies: InitPlan-friendly expressions, no overlapping commands
-- -----------------------------------------------------------------------------

-- 2a. Catalog / content tables: keep the public read policy, make the admin
--     policy write-only (admins still read through the read policy).
do $$
declare
  t text;
  tables text[] := array[
    'authors', 'genres', 'books', 'book_copies', 'plans', 'plan_features',
    'cms_pages', 'settings', 'order_items', 'deposits', 'rentals', 'shipments',
    'shipment_items', 'notifications'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);

    execute format(
      'create policy %I on public.%I for insert with check ((select public.is_admin()))',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete using ((select public.is_admin()))',
      t || '_admin_delete', t);
  end loop;
end $$;

-- 2b. Read policies that mention auth/role helpers.
drop policy if exists authors_read on authors;
create policy authors_read on authors for select using (true);

drop policy if exists genres_read on genres;
create policy genres_read on genres for select using (true);

drop policy if exists copies_read on book_copies;
create policy copies_read on book_copies for select using (true);

drop policy if exists plan_features_read on plan_features;
create policy plan_features_read on plan_features for select using (true);

drop policy if exists settings_read on settings;
create policy settings_read on settings for select using (true);

drop policy if exists books_read on books;
create policy books_read on books
  for select using (is_active or (select public.is_admin()));

drop policy if exists plans_read on plans;
create policy plans_read on plans
  for select using (is_active or (select public.is_admin()));

drop policy if exists cms_pages_read on cms_pages;
create policy cms_pages_read on cms_pages
  for select using (status = 'published' or (select public.is_admin()));

-- 2c. Per-customer tables.
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists profiles_admin_insert on profiles;
create policy profiles_admin_insert on profiles
  for insert with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists addresses_own on addresses;
create policy addresses_own on addresses
  for all using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists subs_select on subscriptions;
create policy subs_select on subscriptions
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists subs_insert on subscriptions;
create policy subs_insert on subscriptions
  for insert with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists subs_update on subscriptions;
create policy subs_update on subscriptions
  for update using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists orders_select on orders;
create policy orders_select on orders
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists orders_insert on orders;
create policy orders_insert on orders
  for insert with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists orders_admin_update on orders;
create policy orders_admin_update on orders
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists order_items_select on order_items;
create policy order_items_select on order_items
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from orders o
       where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists order_items_customer_insert on order_items;
create policy order_items_customer_insert on order_items
  for insert with check (
    (select public.is_admin())
    or exists (
      select 1 from orders o
       where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists payments_select on payments;
create policy payments_select on payments
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists payments_insert on payments;
create policy payments_insert on payments
  for insert with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists payments_admin_update on payments;
create policy payments_admin_update on payments
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists deposits_select on deposits;
create policy deposits_select on deposits
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists rare_select on rare_requests;
create policy rare_select on rare_requests
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists rare_insert on rare_requests;
create policy rare_insert on rare_requests
  for insert with check (user_id = (select auth.uid()) or user_id is null);

drop policy if exists rare_admin_update on rare_requests;
create policy rare_admin_update on rare_requests
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists newsletter_admin_read on newsletter_subscribers;
create policy newsletter_admin_read on newsletter_subscribers
  for select using ((select public.is_admin()));

-- 2d. Rentals, shipments, notifications.
drop policy if exists rentals_select on rentals;
create policy rentals_select on rentals
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists rentals_customer_signup_insert on rentals;
create policy rentals_customer_signup_insert on rentals
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from subscriptions s
       where s.id = subscription_id
         and s.user_id = (select auth.uid())
         and s.status = 'pending'
    )
  );

drop policy if exists shipments_select on shipments;
create policy shipments_select on shipments
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists shipment_items_select on shipment_items;
create policy shipment_items_select on shipment_items
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from shipments s
       where s.id = shipment_id and s.user_id = (select auth.uid())
    )
  );

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 4. Least privilege on functions
-- -----------------------------------------------------------------------------
-- Trigger-only functions: Postgres checks EXECUTE when the trigger is created,
-- never when it fires, so revoking these costs nothing and closes the API door.
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation()  from public, anon, authenticated;
revoke execute on function public.guard_customer_insert()     from public, anon, authenticated;
revoke execute on function public.guard_customer_update()     from public, anon, authenticated;

-- Customer RPCs: they are useless without a session (they check auth.uid()
-- themselves), so signed-out visitors have no business calling them.
revoke execute on function public.add_to_box(uuid)                     from anon;
revoke execute on function public.remove_from_box(uuid)                from anon;
revoke execute on function public.confirm_box(text, uuid)              from anon;
revoke execute on function public.request_return(text, text, uuid)     from anon;
revoke execute on function public.request_deposit_refund()             from anon;

-- is_admin() stays callable by anon + authenticated on purpose: RLS policy
-- expressions run with the caller's privileges, so both roles need EXECUTE or
-- every policy would fail. It only ever reveals a boolean about the caller.
-- run_maintenance() stays callable by anon because the Vercel cron job calls it
-- with the anon key; it is gated by the 32-character secret in settings.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.courier_customer_charge(text, text) to anon, authenticated;
grant execute on function public.run_maintenance(text) to anon, authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
