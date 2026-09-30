-- =============================================================================
-- REY BD — book rental subscription platform
-- Schema, security (RLS), storage and seed data
-- Run this once in Supabase → SQL Editor (or `supabase db push`).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type book_rarity as enum ('common', 'rare');
exception when duplicate_object then null; end $$;

do $$ begin
  create type copy_status as enum ('available', 'rented', 'reserved', 'maintenance', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('pending', 'active', 'paused', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cycle_status as enum ('selecting', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'returned', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('subscription_signup', 'renewal', 'deposit', 'delivery_fee', 'purchase');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('bkash', 'nagad', 'rocket', 'bank', 'cod', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deposit_status as enum ('held', 'refunded', 'forfeited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type courier_name as enum ('steadfast', 'pathao', 'redx', 'bdpost', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_status as enum ('pending', 'dispatched', 'in_transit', 'delivered', 'returned', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('pending', 'sourcing', 'added', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Core: profiles
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  phone       text,
  role        user_role not null default 'customer',
  avatar_url  text,
  notes       text,
  is_blocked  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers must not be able to promote themselves or unblock themselves.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Admin predicate (used by every RLS policy below).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'staff')
  );
$$;

drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard
  before update on profiles
  for each row execute function public.prevent_role_escalation();

-- -----------------------------------------------------------------------------
-- Addresses
-- -----------------------------------------------------------------------------
create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  label       text not null default 'Home',
  recipient   text not null,
  phone       text not null,
  division    text,
  city        text,
  area        text,
  street      text not null,
  postcode    text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_idx on addresses (user_id);

-- -----------------------------------------------------------------------------
-- Catalog: authors, genres, books, copies
-- -----------------------------------------------------------------------------
create table if not exists authors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  bio        text,
  created_at timestamptz not null default now()
);

create table if not exists genres (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int not null default 0
);

create table if not exists books (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  subtitle       text,
  author_id      uuid references authors on delete set null,
  genre_id       uuid references genres on delete set null,
  description    text,
  cover_url      text,
  language       text default 'English',
  isbn           text,
  publisher      text,
  published_year int,
  pages          int,
  rarity         book_rarity not null default 'common',
  is_active      boolean not null default true,
  total_copies   int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists books_title_idx on books using gin (to_tsvector('simple', title));
create index if not exists books_author_idx on books (author_id);
create index if not exists books_genre_idx on books (genre_id);

create table if not exists book_copies (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references books on delete cascade,
  copy_code  text not null,
  status     copy_status not null default 'available',
  condition  text,
  created_at timestamptz not null default now(),
  unique (book_id, copy_code)
);
create index if not exists book_copies_book_idx on book_copies (book_id);

-- -----------------------------------------------------------------------------
-- Plans
-- -----------------------------------------------------------------------------
create table if not exists plans (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  tagline           text,
  price_monthly     numeric(10, 2) not null,
  books_per_month   int not null,
  security_deposit  numeric(10, 2) not null default 500,
  is_popular        boolean not null default false,
  is_active         boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

create table if not exists plan_features (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references plans on delete cascade,
  feature    text not null,
  sort_order int not null default 0
);

-- -----------------------------------------------------------------------------
-- Subscriptions and monthly cycles
-- -----------------------------------------------------------------------------
create table if not exists subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles on delete cascade,
  plan_id             uuid not null references plans on delete restrict,
  status              subscription_status not null default 'pending',
  started_at          timestamptz,
  current_period_start timestamptz,
  current_period_end  timestamptz,
  next_billing_date   date,
  cancelled_at        timestamptz,
  cancel_reason       text,
  created_at          timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on subscriptions (user_id);
create index if not exists subscriptions_status_idx on subscriptions (status);

create table if not exists subscription_cycles (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references subscriptions on delete cascade,
  cycle_number     int not null,
  period_start     date not null default current_date,
  period_end       date,
  status           cycle_status not null default 'selecting',
  notes            text,
  created_at       timestamptz not null default now(),
  unique (subscription_id, cycle_number)
);

create table if not exists cycle_picks (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references subscription_cycles on delete cascade,
  book_id       uuid not null references books on delete restrict,
  copy_id       uuid references book_copies on delete set null,
  status        text not null default 'selected',
  created_at    timestamptz not null default now(),
  unique (cycle_id, book_id)
);

-- -----------------------------------------------------------------------------
-- Orders, payments, deposits, deliveries
-- -----------------------------------------------------------------------------
create sequence if not exists order_number_seq start 1001;

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default 'REY-' || lpad(nextval('order_number_seq')::text, 5, '0'),
  user_id          uuid not null references profiles on delete cascade,
  subscription_id  uuid references subscriptions on delete set null,
  type             order_type not null default 'subscription_signup',
  status           order_status not null default 'pending_payment',
  subtotal         numeric(10, 2) not null default 0,
  delivery_fee     numeric(10, 2) not null default 0,
  deposit_amount   numeric(10, 2) not null default 0,
  discount         numeric(10, 2) not null default 0,
  total            numeric(10, 2) not null default 0,
  address_id       uuid references addresses on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders on delete cascade,
  book_id    uuid references books on delete set null,
  label      text not null,
  quantity   int not null default 1,
  unit_price numeric(10, 2) not null default 0
);

create table if not exists payments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid references orders on delete cascade,
  user_id          uuid not null references profiles on delete cascade,
  method           payment_method not null default 'bkash',
  amount           numeric(10, 2) not null,
  sender_number    text,
  trx_id           text,
  screenshot_url   text,
  status           payment_status not null default 'pending',
  verified_by      uuid references profiles on delete set null,
  verified_at      timestamptz,
  reject_reason    text,
  created_at       timestamptz not null default now()
);
create index if not exists payments_status_idx on payments (status);
create index if not exists payments_user_idx on payments (user_id);

create table if not exists deposits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles on delete cascade,
  subscription_id  uuid references subscriptions on delete set null,
  amount           numeric(10, 2) not null default 500,
  status           deposit_status not null default 'held',
  refunded_at      timestamptz,
  refund_trx_id    text,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists deposits_user_idx on deposits (user_id);

create table if not exists deliveries (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid references orders on delete set null,
  subscription_id  uuid references subscriptions on delete set null,
  address_id       uuid references addresses on delete set null,
  courier          courier_name not null default 'steadfast',
  tracking_code    text,
  status           delivery_status not null default 'pending',
  fee              numeric(10, 2) not null default 0,
  dispatched_at    timestamptz,
  delivered_at     timestamptz,
  notes            text,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Rare book requests + CMS + settings + newsletter
-- -----------------------------------------------------------------------------
create table if not exists rare_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles on delete set null,
  title       text not null,
  author      text,
  note        text,
  contact     text,
  status      request_status not null default 'pending',
  created_at  timestamptz not null default now()
);

create table if not exists cms_pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  excerpt     text,
  content     text,
  status      content_status not null default 'draft',
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table profiles              enable row level security;
alter table addresses             enable row level security;
alter table authors               enable row level security;
alter table genres                enable row level security;
alter table books                 enable row level security;
alter table book_copies           enable row level security;
alter table plans                 enable row level security;
alter table plan_features         enable row level security;
alter table subscriptions         enable row level security;
alter table subscription_cycles   enable row level security;
alter table cycle_picks           enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table payments              enable row level security;
alter table deposits              enable row level security;
alter table deliveries            enable row level security;
alter table rare_requests         enable row level security;
alter table cms_pages             enable row level security;
alter table settings              enable row level security;
alter table newsletter_subscribers enable row level security;

-- profiles
create policy "profiles_select_own" on profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_insert" on profiles for insert with check (id = auth.uid() or public.is_admin());

-- addresses
create policy "addresses_own" on addresses for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- public catalog reads
create policy "authors_read" on authors for select using (true);
create policy "genres_read" on genres for select using (true);
create policy "books_read" on books for select using (is_active or public.is_admin());
create policy "copies_read" on book_copies for select using (true);
create policy "plans_read" on plans for select using (is_active or public.is_admin());
create policy "plan_features_read" on plan_features for select using (true);
create policy "cms_pages_read" on cms_pages for select using (status = 'published' or public.is_admin());

-- admin write access on catalog & content
create policy "authors_admin" on authors for all using (public.is_admin()) with check (public.is_admin());
create policy "genres_admin" on genres for all using (public.is_admin()) with check (public.is_admin());
create policy "books_admin" on books for all using (public.is_admin()) with check (public.is_admin());
create policy "copies_admin" on book_copies for all using (public.is_admin()) with check (public.is_admin());
create policy "plans_admin" on plans for all using (public.is_admin()) with check (public.is_admin());
create policy "plan_features_admin" on plan_features for all using (public.is_admin()) with check (public.is_admin());
create policy "cms_admin" on cms_pages for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions
create policy "subs_select" on subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "subs_insert" on subscriptions for insert with check (user_id = auth.uid() or public.is_admin());
create policy "subs_update" on subscriptions for update using (user_id = auth.uid() or public.is_admin());

-- cycles: visible when the parent subscription is visible
create policy "cycles_select" on subscription_cycles for select using (
  public.is_admin() or exists (
    select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid()
  )
);
create policy "cycles_admin_write" on subscription_cycles for all using (public.is_admin()) with check (public.is_admin());
-- A customer opening the first cycle of their own new subscription.
create policy "cycles_customer_insert" on subscription_cycles for insert with check (
  public.is_admin() or exists (
    select 1 from subscriptions s where s.id = subscription_id and s.user_id = auth.uid()
  )
);

create policy "picks_select" on cycle_picks for select using (
  public.is_admin() or exists (
    select 1 from subscription_cycles c
    join subscriptions s on s.id = c.subscription_id
    where c.id = cycle_id and s.user_id = auth.uid()
  )
);
create policy "picks_customer_insert" on cycle_picks for insert with check (
  public.is_admin() or exists (
    select 1 from subscription_cycles c
    join subscriptions s on s.id = c.subscription_id
    where c.id = cycle_id and s.user_id = auth.uid() and c.status = 'selecting'
  )
);
create policy "picks_customer_delete" on cycle_picks for delete using (
  public.is_admin() or exists (
    select 1 from subscription_cycles c
    join subscriptions s on s.id = c.subscription_id
    where c.id = cycle_id and s.user_id = auth.uid() and c.status = 'selecting'
  )
);

-- orders
create policy "orders_select" on orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert" on orders for insert with check (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on orders for update using (public.is_admin());

create policy "order_items_select" on order_items for select using (
  public.is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order_items_admin" on order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "order_items_customer_insert" on order_items for insert with check (
  public.is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

-- payments
create policy "payments_select" on payments for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_insert" on payments for insert with check (user_id = auth.uid() or public.is_admin());
create policy "payments_admin_update" on payments for update using (public.is_admin());

-- deposits
create policy "deposits_select" on deposits for select using (user_id = auth.uid() or public.is_admin());
create policy "deposits_admin" on deposits for all using (public.is_admin()) with check (public.is_admin());

-- deliveries
create policy "deliveries_select" on deliveries for select using (
  public.is_admin() or exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  )
);
create policy "deliveries_admin" on deliveries for all using (public.is_admin()) with check (public.is_admin());

-- rare requests
create policy "rare_select" on rare_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "rare_insert" on rare_requests for insert with check (user_id = auth.uid() or user_id is null);
create policy "rare_admin_update" on rare_requests for update using (public.is_admin());

-- settings: public read (storefront needs bank/courier info), admin write
create policy "settings_read" on settings for select using (true);
create policy "settings_admin" on settings for all using (public.is_admin()) with check (public.is_admin());

-- newsletter
create policy "newsletter_insert" on newsletter_subscribers for insert with check (true);
create policy "newsletter_admin_read" on newsletter_subscribers for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Storage buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Public read for book covers
drop policy if exists "covers_public_read" on storage.objects;
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'book-covers');

drop policy if exists "covers_admin_write" on storage.objects;
create policy "covers_admin_write" on storage.objects
  for all using (bucket_id = 'book-covers' and public.is_admin())
  with check (bucket_id = 'book-covers' and public.is_admin());

-- Payment proofs: owner uploads, owner + admin read
drop policy if exists "proofs_insert_own" on storage.objects;
create policy "proofs_insert_own" on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and auth.uid() is not null);

drop policy if exists "proofs_read" on storage.objects;
create policy "proofs_read" on storage.objects
  for select using (bucket_id = 'payment-proofs' and (public.is_admin() or owner = auth.uid()));

-- -----------------------------------------------------------------------------
-- Analytics helper
-- -----------------------------------------------------------------------------
-- Runs with the caller's privileges, so RLS narrows the numbers for
-- non-admins automatically. No SECURITY DEFINER needed.
create or replace function public.admin_dashboard_stats()
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'active_subscriptions', (select count(*) from subscriptions where status = 'active'),
    'pending_subscriptions', (select count(*) from subscriptions where status = 'pending'),
    'customers',            (select count(*) from profiles where role = 'customer'),
    'pending_payments',     (select count(*) from payments where status = 'pending'),
    'open_requests',        (select count(*) from rare_requests where status in ('pending','sourcing')),
    'titles',               (select count(*) from books where is_active),
    'held_deposits',        (select coalesce(sum(amount), 0) from deposits where status = 'held'),
    'mrr',                  (select coalesce(sum(p.price_monthly), 0)
                               from subscriptions s join plans p on p.id = s.plan_id
                              where s.status = 'active')
  );
$$;

grant execute on function public.admin_dashboard_stats() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Guard triggers: a signed-in customer may only perform the writes the
-- storefront actually needs. Anything money-related is frozen for them, so a
-- crafted request straight to the Supabase API cannot fake a payment or
-- activate a subscription. Admins bypass every guard.
-- -----------------------------------------------------------------------------

create or replace function public.guard_customer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
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

create or replace function public.guard_customer_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'orders' then
    new.status := 'pending_payment';
  elsif tg_table_name = 'payments' then
    new.status := 'pending';
    new.verified_by := null;
    new.verified_at := null;
    new.reject_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_customer_guard on subscriptions;
create trigger subscriptions_customer_guard
  before update on subscriptions
  for each row execute function public.guard_customer_update();

drop trigger if exists orders_customer_guard on orders;
create trigger orders_customer_guard
  before insert on orders
  for each row execute function public.guard_customer_insert();

drop trigger if exists payments_customer_guard on payments;
create trigger payments_customer_guard
  before insert on payments
  for each row execute function public.guard_customer_insert();

-- -----------------------------------------------------------------------------
-- Explicit grants, so the migration is self-contained even if the project's
-- default privileges differ. RLS on every table above is what decides access.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

