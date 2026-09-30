-- =============================================================================
-- REY BD — 0003: rental lifecycle, swaps, shipments, deposits, notifications
--
-- Brings the platform in line with the WordPress "Rey BD Book Club" plugin:
--
--   * a membership is a QUOTA + an EXPIRY (rolling month, not "pick once")
--   * every borrowed book is a `rental` row with its own due date
--   * every trip is a `shipment`: outbound, swap (new out + old back, one trip)
--     or return, with the courier charge split between customer and shop
--   * balances: unpaid -> held -> requested -> refunded
--   * a daily maintenance job expires plans and queues renewal reminders
--
-- Safe to re-run. Run AFTER 20260930120000_init.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Retire the tables that the rental model replaces.
--    (Nothing valuable is lost: a fresh install has no rows in these.)
-- -----------------------------------------------------------------------------
drop table if exists deliveries cascade;
drop table if exists cycle_picks cascade;
drop table if exists subscription_cycles cascade;

-- -----------------------------------------------------------------------------
-- 2. Book extras: demand tier and replacement value (charged if a book is lost)
-- -----------------------------------------------------------------------------
alter table books add column if not exists demand text not null default 'medium';
alter table books add column if not exists replacement_value numeric(10, 2) not null default 0;
alter table books add column if not exists weight_grams int;

alter table orders add column if not exists courier text;
alter table orders add column if not exists trip_type text;

alter table deposits add column if not exists refund_requested_at timestamptz;
alter table deposits add column if not exists refund_requested_note text;

alter table profiles add column if not exists courier_preference text not null default 'steadfast';

do $$ begin
  alter table books add constraint books_demand_check check (demand in ('high', 'medium', 'low'));
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 3. Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type rental_status as enum ('pending', 'out', 'returning', 'returned', 'lost', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipment_type as enum ('outbound', 'swap', 'return');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipment_status as enum ('pending', 'awaiting_post', 'packed', 'shipped', 'delivered', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum ('renewal', 'dispatch', 'return', 'deposit', 'overdue', 'custom');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 4. Rentals — one row per borrowed book
-- -----------------------------------------------------------------------------
create table if not exists rentals (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles on delete cascade,
  subscription_id    uuid references subscriptions on delete set null,
  book_id            uuid not null references books on delete restrict,
  copy_id            uuid references book_copies on delete set null,
  order_id           uuid references orders on delete set null,
  status             rental_status not null default 'pending',
  replacement_value  numeric(10, 2) not null default 0,
  checked_out_at     timestamptz,
  due_at             timestamptz,
  returned_at        timestamptz,
  lost_at            timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists rentals_user_idx on rentals (user_id);
create index if not exists rentals_book_idx on rentals (book_id);
create index if not exists rentals_status_idx on rentals (status);
create index if not exists rentals_due_idx on rentals (due_at);

-- -----------------------------------------------------------------------------
-- 5. Shipments + their contents
-- -----------------------------------------------------------------------------
create table if not exists shipments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles on delete cascade,
  order_id         uuid references orders on delete set null,
  subscription_id  uuid references subscriptions on delete set null,
  address_id       uuid references addresses on delete set null,
  type             shipment_type not null default 'outbound',
  courier          courier_name not null default 'steadfast',
  status           shipment_status not null default 'pending',
  customer_charge  numeric(10, 2) not null default 0,
  merchant_charge  numeric(10, 2) not null default 0,
  tracking         text,
  bdpost_receipt   text,
  notes            text,
  dispatched_at    timestamptz,
  delivered_at     timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists shipments_user_idx on shipments (user_id);
create index if not exists shipments_status_idx on shipments (status);
create index if not exists shipments_type_idx on shipments (type);

create table if not exists shipment_items (
  id           uuid primary key default gen_random_uuid(),
  shipment_id  uuid not null references shipments on delete cascade,
  rental_id    uuid not null references rentals on delete cascade,
  direction    text not null default 'out' check (direction in ('out', 'in')),
  created_at   timestamptz not null default now(),
  unique (shipment_id, rental_id, direction)
);
create index if not exists shipment_items_shipment_idx on shipment_items (shipment_id);
create index if not exists shipment_items_rental_idx on shipment_items (rental_id);

-- -----------------------------------------------------------------------------
-- 6. Notifications (outbox) — the WhatsApp/email work queue for the shop
-- -----------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles on delete cascade,
  kind       notification_kind not null default 'custom',
  channel    text not null default 'whatsapp',
  subject    text,
  body       text not null,
  phone      text,
  email      text,
  status     text not null default 'queued',
  sent_at    timestamptz,
  error      text,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists notifications_status_idx on notifications (status);
create index if not exists notifications_user_idx on notifications (user_id);

-- -----------------------------------------------------------------------------
-- 7. Settings: courier rates, rental rules, WhatsApp templates, warehouse
-- -----------------------------------------------------------------------------
insert into settings (key, value) values
  ('couriers', jsonb_build_object(
    'methods', jsonb_build_array(
      jsonb_build_object('key','steadfast','label','Steadfast','charge',80,'percent',50,'return_charge',80),
      jsonb_build_object('key','pathao','label','Pathao','charge',80,'percent',50,'return_charge',80),
      jsonb_build_object('key','redx','label','RedX','charge',80,'percent',50,'return_charge',80),
      jsonb_build_object('key','other','label','Other courier','charge',80,'percent',50,'return_charge',80)
    ),
    'bdpost', jsonb_build_object('label','BD Post','charge',0,'max_kg',5,
      'rules','BD Post Book Packet rules (confirm with your local post office; rules can change):

1. Write BOOK POST clearly on the packet.
2. The packet may contain only books / printed matter. No letters, money, gifts or electronics.
3. Wrap it so postal staff can inspect the contents. Do not seal it like a secret parcel.
4. Stick the REY BD return address slip on the packet.
5. Stay within the weight limit set in settings.
6. Hand it in at the post office, keep the receipt, and enter the receipt number in your account.

If these rules are not followed, BD Post can refuse the packet or charge normal parcel postage.')
  )),
  ('rental', jsonb_build_object(
    'duration_days', 30,
    'block_overdue', true,
    'renew_notice_days', 3,
    'max_parallel_rentals', 0
  )),
  ('whatsapp', jsonb_build_object(
    'country_code', '880',
    'renew_text', 'Hello {name}, your REY BD plan "{plan}" expires on {expires} ({days} days left). Renew here: {renew}',
    'order_text', 'Hello {name}, your REY BD books are on the way. Books: {books}. Please reply to confirm.'
  )),
  ('warehouse', jsonb_build_object(
    'name', 'REY BD Book Club',
    'phone', '+880 17921 02092',
    'address', 'House # 28, Road # 8/A, Nikunjo-1, Dhaka-1229'
  )),
  ('system', jsonb_build_object(
    'cron_secret', encode(gen_random_bytes(16), 'hex')
  ))
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 8. Courier pricing helper — the single source of truth for every fee
-- -----------------------------------------------------------------------------
create or replace function public.courier_customer_charge(
  p_courier text,
  p_trip text default 'outbound'
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
  cfg    jsonb;
  method jsonb;
  total  numeric;
  pct    numeric;
begin
  select value into cfg from settings where key = 'couriers';
  if cfg is null then
    return 0;
  end if;

  if p_courier = 'bdpost' then
    return coalesce((cfg -> 'bdpost' ->> 'charge')::numeric, 0);
  end if;

  select elem into method
  from jsonb_array_elements(coalesce(cfg -> 'methods', '[]'::jsonb)) as elem
  where elem ->> 'key' = p_courier
  limit 1;

  if method is null then
    return 0;
  end if;

  if p_trip = 'return'
     and (method ? 'return_charge')
     and nullif(method ->> 'return_charge', '') is not null then
    total := (method ->> 'return_charge')::numeric;
  else
    total := coalesce((method ->> 'charge')::numeric, 0);
  end if;

  pct := least(100, greatest(0, coalesce((method ->> 'percent')::numeric, 100)));
  return round(total * pct / 100, 2);
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. Customer-facing RPCs (SECURITY DEFINER, so all rules are enforced here
--    and a crafted API call cannot bypass quota, fees or overdue checks)
-- -----------------------------------------------------------------------------

-- 9a. Put a book in this month's box.
create or replace function public.add_to_box(p_book_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  sub          subscriptions;
  quota        int;
  used         int;
  copies       int;
  active_count int;
  b            books;
begin
  if uid is null then
    raise exception 'Please sign in first.';
  end if;
  perform set_config('rey.system', 'on', true);

  select * into sub from subscriptions
   where user_id = uid and status = 'active'
   order by created_at desc limit 1;

  if sub.id is null then
    raise exception 'You need an active plan before picking books.';
  end if;

  quota := coalesce((select books_per_month from plans where id = sub.plan_id), 0);
  if quota < 1 then
    raise exception 'Your plan has no book quota set. Please contact support.';
  end if;

  if coalesce((select (value ->> 'block_overdue')::boolean from settings where key = 'rental'), true)
     and exists (
       select 1 from rentals r
        where r.user_id = uid and r.status in ('out', 'returning')
          and r.due_at is not null and r.due_at < now()
     ) then
    raise exception 'Please return your overdue books before picking new ones.';
  end if;

  select count(*) into used from rentals r
   where r.user_id = uid
     and r.status in ('pending', 'out', 'returning')
     and r.created_at >= coalesce(sub.current_period_start, sub.started_at, now());

  if used >= quota then
    raise exception 'All % book slots for this month are already used. Return or swap to free them up.', quota;
  end if;

  select * into b from books where id = p_book_id and is_active;
  if b.id is null then
    raise exception 'That title is not available to rent.';
  end if;
  if b.rarity = 'rare' then
    raise exception 'Rare titles are request-only — send us a request instead.';
  end if;

  if exists (
    select 1 from rentals r
     where r.user_id = uid and r.book_id = p_book_id
       and r.status in ('pending', 'out', 'returning')
  ) then
    raise exception 'That book is already in your box.';
  end if;

  copies := greatest(1, coalesce(b.total_copies, 1));
  select count(*) into active_count from rentals r
   where r.book_id = p_book_id and r.status in ('pending', 'out', 'returning');
  if active_count >= copies then
    raise exception 'All % copies of that title are out right now. Try another one.', copies;
  end if;

  insert into rentals (user_id, subscription_id, book_id, status, due_at, replacement_value)
  values (
    uid,
    sub.id,
    p_book_id,
    'pending',
    coalesce(sub.current_period_end, now() + interval '30 days'),
    greatest(coalesce(b.replacement_value, 0), 0)
  );

  return json_build_object('ok', true, 'quota', quota, 'used', used + 1, 'remaining', quota - used - 1);
end;
$$;

-- 9b. Take a book back out of the box (only while it has not shipped).
create or replace function public.remove_from_box(p_rental_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Please sign in first.';
  end if;
  perform set_config('rey.system', 'on', true);

  delete from rentals r
   where r.id = p_rental_id
     and r.user_id = uid
     and r.status = 'pending'
     and not exists (select 1 from shipment_items si where si.rental_id = r.id);

  if not found then
    raise exception 'That book is not in your box.';
  end if;

  return json_build_object('ok', true);
end;
$$;

-- 9c. Confirm the box: creates the trip (outbound or swap) and any courier fee.
create or replace function public.confirm_box(
  p_courier text default 'steadfast',
  p_address_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  sub        subscriptions;
  box_count  int;
  old_count  int;
  trip       text;
  fee        numeric;
  courier    text;
  shipment   uuid;
  ord        uuid;
begin
  if uid is null then
    raise exception 'Please sign in first.';
  end if;
  perform set_config('rey.system', 'on', true);

  select * into sub from subscriptions
   where user_id = uid and status = 'active'
   order by created_at desc limit 1;
  if sub.id is null then
    raise exception 'You need an active plan first.';
  end if;

  select count(*) into box_count from rentals r
   where r.user_id = uid and r.status = 'pending';
  if box_count = 0 then
    raise exception 'Your box is empty. Pick some books first.';
  end if;

  if coalesce((select (value ->> 'block_overdue')::boolean from settings where key = 'rental'), true)
     and exists (
       select 1 from rentals r
        where r.user_id = uid and r.status in ('out', 'returning')
          and r.due_at is not null and r.due_at < now()
     ) then
    raise exception 'Please return your overdue books before confirming a new box.';
  end if;

  -- Books still out from an earlier period come back on this same trip: a swap.
  select count(*) into old_count from rentals r
   where r.user_id = uid
     and r.status = 'out'
     and coalesce(r.checked_out_at, r.created_at) < coalesce(sub.current_period_start, sub.started_at, now());

  trip := case when old_count > 0 then 'swap' else 'outbound' end;

  courier := coalesce(nullif(trim(coalesce(p_courier, '')), ''), 'steadfast');
  if courier = 'bdpost' then
    courier := 'steadfast'; -- BD Post is for returns only
  end if;

  fee := public.courier_customer_charge(courier, trip);

  insert into shipments (user_id, subscription_id, address_id, type, courier, status, customer_charge, merchant_charge)
  values (uid, sub.id, p_address_id, trip::shipment_type, courier::courier_name, 'pending', fee, 0)
  returning id into shipment;

  insert into shipment_items (shipment_id, rental_id, direction)
  select shipment, r.id, 'out'
  from rentals r
  where r.user_id = uid and r.status = 'pending'
    and not exists (select 1 from shipment_items si where si.rental_id = r.id and si.direction = 'out');

  if trip = 'swap' then
    update rentals
       set status = 'returning', updated_at = now()
     where user_id = uid
       and status = 'out'
       and coalesce(checked_out_at, created_at) < coalesce(sub.current_period_start, sub.started_at, now());

    insert into shipment_items (shipment_id, rental_id, direction)
    select shipment, r.id, 'in'
    from rentals r
    where r.user_id = uid and r.status = 'returning'
      and not exists (select 1 from shipment_items si where si.rental_id = r.id and si.direction = 'in');
  end if;

  if fee > 0 then
    insert into orders (
      user_id, subscription_id, type, status, subtotal, delivery_fee,
      deposit_amount, discount, total, address_id, courier, trip_type, notes
    ) values (
      uid, sub.id, 'delivery_fee', 'pending_payment', fee, fee,
      0, 0, fee, p_address_id, courier, trip, 'Courier fee — ' || trip
    ) returning id into ord;

    insert into order_items (order_id, label, quantity, unit_price)
    values (ord, 'Courier — ' || trip || ' (' || courier || ')', 1, fee);
  end if;

  return json_build_object(
    'ok', true,
    'shipment_id', shipment,
    'order_id', ord,
    'trip', trip,
    'fee', fee,
    'courier', courier,
    'books', box_count
  );
end;
$$;

-- 9d. Ask us to collect your books.
create or replace function public.request_return(
  p_courier text default 'steadfast',
  p_receipt text default '',
  p_address_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  sub       subscriptions;
  courier   text;
  fee       numeric;
  st        shipment_status;
  shipment  uuid;
  ord       uuid;
  n         int;
begin
  if uid is null then
    raise exception 'Please sign in first.';
  end if;
  perform set_config('rey.system', 'on', true);

  select * into sub from subscriptions
   where user_id = uid
   order by created_at desc limit 1;

  select count(*) into n from rentals r
   where r.user_id = uid and r.status = 'out';
  if n = 0 then
    raise exception 'You have no books out to return.';
  end if;

  courier := coalesce(nullif(trim(coalesce(p_courier, '')), ''), 'steadfast');
  fee     := public.courier_customer_charge(courier, 'return');
  st      := (case when courier = 'bdpost' then 'awaiting_post' else 'pending' end)::shipment_status;

  insert into shipments (
    user_id, subscription_id, address_id, type, courier, status,
    customer_charge, merchant_charge, bdpost_receipt
  ) values (
    uid, sub.id, p_address_id, 'return', courier::courier_name, st,
    fee, 0, nullif(trim(coalesce(p_receipt, '')), '')
  ) returning id into shipment;

  update rentals
     set status = 'returning', updated_at = now()
   where user_id = uid and status = 'out';

  insert into shipment_items (shipment_id, rental_id, direction)
  select shipment, r.id, 'in'
  from rentals r
  where r.user_id = uid and r.status = 'returning'
    and not exists (select 1 from shipment_items si where si.rental_id = r.id and si.direction = 'in');

  if fee > 0 then
    insert into orders (
      user_id, subscription_id, type, status, subtotal, delivery_fee,
      deposit_amount, discount, total, address_id, courier, trip_type, notes
    ) values (
      uid, sub.id, 'delivery_fee', 'pending_payment', fee, fee,
      0, 0, fee, p_address_id, courier, 'return', 'Return pickup fee'
    ) returning id into ord;

    insert into order_items (order_id, label, quantity, unit_price)
    values (ord, 'Return pickup (' || courier || ')', 1, fee);
  end if;

  return json_build_object(
    'ok', true, 'shipment_id', shipment, 'order_id', ord,
    'fee', fee, 'courier', courier, 'books', n, 'status', st
  );
end;
$$;

-- 9e. "I would like my deposit back."
create or replace function public.request_deposit_refund()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n   int;
begin
  if uid is null then
    raise exception 'Please sign in first.';
  end if;
  perform set_config('rey.system', 'on', true);

  select count(*) into n from rentals r
   where r.user_id = uid and r.status in ('pending', 'out', 'returning');
  if n > 0 then
    raise exception 'Return all your books before asking for the deposit back.';
  end if;

  update deposits
     set refund_requested_at = now()
   where user_id = uid and status = 'held' and refund_requested_at is null;

  if not found then
    raise exception 'You have no deposit held with us to refund.';
  end if;

  return json_build_object('ok', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- 10. Daily maintenance (called by the cron route with the shared secret)
-- -----------------------------------------------------------------------------
create or replace function public.run_maintenance(p_secret text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  expected   text;
  days       int;
  expired    int := 0;
  reminded   int := 0;
  overdue    int := 0;
  sub        record;
  sites      text;
begin
  select value ->> 'cron_secret' into expected from settings where key = 'system';
  if expected is null or expected = '' or p_secret is null or p_secret <> expected then
    raise exception 'unauthorized';
  end if;
  perform set_config('rey.system', 'on', true);

  select coalesce((value ->> 'renew_notice_days')::int, 3) into days
  from settings where key = 'rental';
  days := coalesce(days, 3);
  sites := coalesce((select value ->> 'name' from settings where key = 'site'), 'REY BD');

  -- Expire memberships whose month is over.
  update subscriptions
     set status = 'expired'
   where status = 'active'
     and current_period_end is not null
     and current_period_end < now();
  get diagnostics expired = row_count;

  -- Queue a renewal reminder once per period.
  for sub in
    select s.id, s.user_id, s.current_period_end, p.name as plan_name,
           pr.full_name, pr.phone, p.price_monthly
      from subscriptions s
      join plans p on p.id = s.plan_id
      join profiles pr on pr.id = s.user_id
     where s.status = 'active'
       and s.current_period_end is not null
       and s.current_period_end between now() and now() + (days || ' days')::interval
  loop
    if not exists (
      select 1 from notifications n
       where n.user_id = sub.user_id
         and n.kind = 'renewal'
         and n.meta ->> 'period_end' = sub.current_period_end::text
    ) then
      insert into notifications (user_id, kind, channel, subject, body, phone, meta)
      values (
        sub.user_id,
        'renewal',
        'whatsapp',
        'Your ' || sites || ' plan expires soon',
        replace(
          replace(
            replace(
              replace(
                coalesce((select value ->> 'renew_text' from settings where key = 'whatsapp'),
                  'Hello {name}, your plan expires on {expires}.'),
                '{name}', coalesce(sub.full_name, 'there')),
              '{plan}', sub.plan_name),
            '{expires}', to_char(sub.current_period_end, 'DD Mon YYYY')),
          '{days}', greatest(0, ceil(extract(epoch from (sub.current_period_end - now())) / 86400))::text),
        sub.phone,
        jsonb_build_object('period_end', sub.current_period_end::text, 'subscription_id', sub.id)
      );
      reminded := reminded + 1;
    end if;
  end loop;

  -- Queue an overdue nudge once per rental.
  insert into notifications (user_id, kind, channel, subject, body, phone, meta)
  select r.user_id, 'overdue', 'whatsapp', 'Overdue books at ' || sites,
         'Hello, you have ' || count(*) || ' overdue book(s). Please return them to keep renting.',
         pr.phone,
         jsonb_build_object('rentals', count(*)::text)
    from rentals r
    join profiles pr on pr.id = r.user_id
   where r.status in ('out', 'returning')
     and r.due_at is not null
     and r.due_at < now() - interval '3 days'
     and not exists (
       select 1 from notifications n
        where n.user_id = r.user_id and n.kind = 'overdue'
          and n.created_at > now() - interval '7 days'
     )
   group by r.user_id, pr.phone;
  get diagnostics overdue = row_count;

  return json_build_object(
    'ok', true,
    'expired', expired,
    'reminded', reminded,
    'overdue_notices', overdue,
    'ran_at', now()
  );
end;
$$;

grant execute on function public.courier_customer_charge(text, text) to anon, authenticated;
grant execute on function public.add_to_box(uuid) to authenticated;
grant execute on function public.remove_from_box(uuid) to authenticated;
grant execute on function public.confirm_box(text, uuid) to authenticated;
grant execute on function public.request_return(text, text, uuid) to authenticated;
grant execute on function public.request_deposit_refund() to authenticated;
revoke all on function public.run_maintenance(text) from public;
grant execute on function public.run_maintenance(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 11. Guard triggers (redefined): a customer can never write money or
--     lifecycle fields directly. The RPCs above set `rey.system` so the guards
--     step aside for the vetted server-side logic.
-- -----------------------------------------------------------------------------
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
declare
  quota int;
  used  int;
begin
  if coalesce(current_setting('rey.system', true), '') = 'on' then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'orders' then
    new.status := 'pending_payment';
    -- Courier-fee orders are priced by the database, never by the client.
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
    -- Sign-up phase only: the box must never arrive pre-packed with extras.
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

drop trigger if exists rentals_customer_guard on rentals;
create trigger rentals_customer_guard
  before insert on rentals
  for each row execute function public.guard_customer_insert();

-- -----------------------------------------------------------------------------
-- 12. Row Level Security — customers read their own data; only the RPCs above
--     (which enforce every rule) can write on their behalf.
-- -----------------------------------------------------------------------------
alter table rentals        enable row level security;
alter table shipments      enable row level security;
alter table shipment_items enable row level security;
alter table notifications  enable row level security;

drop policy if exists "rentals_select" on rentals;
create policy "rentals_select" on rentals
  for select using (user_id = auth.uid() or public.is_admin());

-- Only during sign-up (subscription still pending) may a customer create
-- rentals directly. After that, only `add_to_box()` can, so quota holds.
drop policy if exists "rentals_customer_signup_insert" on rentals;
create policy "rentals_customer_signup_insert" on rentals
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from subscriptions s
       where s.id = subscription_id
         and s.user_id = auth.uid()
         and s.status = 'pending'
    )
  );

drop policy if exists "rentals_admin_write" on rentals;
create policy "rentals_admin_write" on rentals
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shipments_select" on shipments;
create policy "shipments_select" on shipments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "shipments_admin_write" on shipments;
create policy "shipments_admin_write" on shipments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "shipment_items_select" on shipment_items;
create policy "shipment_items_select" on shipment_items
  for select using (
    public.is_admin()
    or exists (select 1 from shipments s where s.id = shipment_id and s.user_id = auth.uid())
  );

drop policy if exists "shipment_items_admin_write" on shipment_items;
create policy "shipment_items_admin_write" on shipment_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications_select" on notifications;
create policy "notifications_select" on notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_admin_write" on notifications;
create policy "notifications_admin_write" on notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 13. Dashboard metrics, now including the rental side of the business
-- -----------------------------------------------------------------------------
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
    'deposits_requested',   (select count(*) from deposits where status = 'held' and refund_requested_at is not null),
    'mrr',                  (select coalesce(sum(p.price_monthly), 0)
                               from subscriptions s join plans p on p.id = s.plan_id
                              where s.status = 'active'),
    'books_out',            (select count(*) from rentals where status in ('pending','out','returning')),
    'to_ship',              (select count(*) from shipments where status = 'pending' and type in ('outbound','swap')),
    'returns_pending',      (select count(*) from shipments where status in ('pending','awaiting_post') and type = 'return'),
    'overdue_rentals',      (select count(*) from rentals
                              where status in ('out','returning')
                                and due_at is not null and due_at < now()),
    'notifications_queued', (select count(*) from notifications where status = 'queued')
  );
$$;
