# REY BD — book rental subscription platform

A subscription e-commerce store for a book rental club in Bangladesh, plus a full
admin dashboard ("WordPress-CRM style") to run the whole business without touching code.

Built with **Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + Supabase + Vercel**.

---

## What it does

**Storefront**

- Home, plan comparison, how-it-works, about, contact, rare books, policies/FAQ (CMS-driven)
- Library catalog with search, genre/language filters, pagination and book detail pages
- **Subscribe flow:** pick a plan → choose exactly N books → pick a courier → add an address → order created
- **Manual payments:** customer pays by bKash / Nagad / Rocket, submits the TrxID (and an optional screenshot), and waits for verification
- Account area: membership, monthly book picks, orders, payments, deposits, addresses, profile & password

**Admin dashboard** (`/admin`)

- Overview: MRR, active members, pending payments, deposits held, open requests
- Orders (with line items, status changes, delivery address) and full order detail
- Subscriptions with status control
- **Payments approval:** verify a TrxID → subscription activates, deposit is held, first delivery is queued automatically
- Deliveries (courier, tracking code, dispatch/delivered timestamps)
- Deposits ledger with refunds
- Customers / CRM: profiles, roles, internal notes, blocking, lifetime value, rental history
- Books CRUD with cover upload to Supabase Storage
- **Book import:** search a title / author / ISBN, preview real covers, and import in one click — the cover is copied into your own storage and physical copies are created automatically
- Plans & pricing CRUD (price, books per month, deposit, features)
- Rare book requests
- CMS pages (policies, about, FAQ) with draft/published
- Settings: store details, announcement bar, payment numbers, courier fees, deposit

---

## Quick start

```bash
npm install
```

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Save the database password.
2. **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Create `.env.local` (copy `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Create the database

Pick either route — they do the same thing. Run **every** file in `supabase/migrations/` in
filename order.

**Route A — the Supabase dashboard (no password needed)**

Open the **SQL Editor**, then for each file: open it, select all, copy, paste into a new query,
and press **Run**. Do them in order.

**Route B — the Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>   # asks for your database password
npx supabase db push
```

> On Windows, PowerShell blocks `npm`/`npx` scripts by default. Use **cmd.exe** or
> **Git Bash** for those commands (or write `npx.cmd` instead of `npx`).
>
> If you forget your database password, reset it under **Settings → Database**.
> Route A avoids needing it at all.

| File | What it does |
| --- | --- |
| `20260930120000_init.sql` | Tables, enums, RLS policies, guard triggers, storage buckets |
| `20260930120100_seed.sql` | 3 plans, 16 genres, 16 authors, 16 books, 8 CMS pages, default settings |
| `20260930120200_rentals_shipments.sql` | Rentals, swaps, shipments, deposits, notification outbox, cron maintenance, courier pricing |
| `20260930130000_hardening.sql` | Foreign-key and partial indexes; RLS policies rewritten for performance |
| `20260930140000_policy_cleanup.sql` | Merges overlapping INSERT policies |
| `20260930150000_function_privileges.sql` | Revokes the default `PUBLIC` grant on functions; least-privilege grants |
| `20260930160000_admin_promotion_fix.sql` | Lets direct SQL access promote an admin (the SQL Editor has no JWT, so the old guard silently reverted it) |

Every file is safe to re-run. The last three are hardening/tuning and are applied
automatically by `supabase db push`.

### 3. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, register an account, and then make yourself an admin:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Then sign out and back in and visit `/admin`.

> **Tip:** Supabase sends a confirmation email on sign-up. For local testing you can turn
> that off under **Authentication → Sign In / Providers → Email → Confirm email**.

---

## Design system

**Monochrome: black, white and neutral greys. No colour, by instruction.**

Tokens live in **`src/app/globals.css`** (`@theme`). Change them there and the whole site follows —
no need to touch individual pages.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-ink` | `#090909` | body text, headings, primary buttons (matches the logo) |
| `--color-ink-deep` | `#000000` | hard black |
| `--color-ink-soft` | `#525252` | secondary copy |
| `--color-ink-muted` | `#8a8a8a` | captions, table headers |
| `--color-paper` | `#ffffff` | page background |
| `--color-surface` (`cream`) | `#f5f5f5` | alternating section bands |
| `--color-frost` | `#ececec` | problem pills |
| `--color-line` | `#e5e5e5` | borders |
| `--shadow-card`, `--shadow-paper` | | elevation |

Every grey is **purely neutral** (`r === g === b`), so nothing has a blue or warm cast.

### The monochrome lock

At the bottom of the `@theme` block, every colour family Tailwind ships (`rose`, `emerald`,
`amber`, `sky`, `blue`, `violet`, …) is remapped onto greys. So `text-rose-600` renders black and
`bg-amber-50` renders light grey. This is deliberate: colour cannot creep back in from a stray
class. **Use the semantic tokens (`ink`, `surface`, `frost`, `line`) in new code.**

Because hue is gone, status meaning is carried by **fill** instead:

| Treatment | Class | Meaning |
| --- | --- | --- |
| Solid black | `.tone-good` | done — active, paid, verified, delivered |
| Outlined | `.tone-progress` | in progress — pending, packed, shipped |
| Grey + ring | `.tone-problem` | needs attention — cancelled, rejected, overdue |
| Light grey | `.tone-neutral` | informational |

Alerts follow the same logic: errors invert to black, warnings sit on a tinted panel, success gets
a black border, info stays soft.

### Logo

`public/brand/rey-logo-black.svg` (header, dashboard) and `public/brand/rey-logo-white.svg`
(footer, auth panel) — the original REY wordmark, served locally rather than hot-linked.

### Typography & components

One family (Inter). Headings are 800 weight with tight negative tracking (h1 `-0.035em`); body is
16px / 1.6 at `-0.011em`. Buttons are pills with real shadows (they lift on hover). Cards are 16px
radius.

Reusable classes: `.container-page`, `.section`, `.card`, `.panel`, `.rule`,
`.btn` + `-primary` / `-gold` / `-outline` / `-ghost` / `-sm`, `.field`, `.label`, `.eyebrow`,
`.pill`, `.tone-*`, `.table`, `.table-wrap`.

> The token names `gold` and `cream` are **legacy aliases** kept so existing classes keep working —
> `gold` is now black, `cream` is light grey. Prefer `ink` and `surface` in new code.

## Verification & email that actually arrives

Three different things get called "verification". Two are already handled:

| Kind | How it works |
| --- | --- |
| **Payment** | Customer pays by bKash/Nagad, submits the TrxID, you approve it in Payments |
| **Delivery** | The courier calls before handover and the customer checks the package |
| **Account** | Email confirmation link (Supabase), plus a free phone check on payments |

**Account verification.** Supabase emails a confirmation link on sign-up and the app shows a
"check your inbox" screen with a resend button. Two things to know:

1. Supabase's built-in mailer is limited to a handful of emails per hour and often lands in spam.
   **Connect your own SMTP before taking real sign-ups** (below).
2. Phone numbers are collected at sign-up and used by couriers, but they are **not** OTP-verified.
   Instead, the Payments screen compares the **bKash/Nagad sender number** with the customer's
   profile phone and flags a mismatch for you to review. It is free, needs no SMS credits, and
   catches the common case. Add real SMS OTP later only if you start seeing fake accounts (a local
   BD gateway is ~৳0.5/SMS, but Supabase does not support those natively, so it needs a custom
   function).

### Email that actually arrives (Brevo)

Brevo's free tier covers 300 emails/day, which is plenty at the start.

1. Create an account at **brevo.com** → **Senders & IPs → Senders** → add
   `hello@yourdomain.com` and click the verification link they send.
2. **SMTP & API → SMTP** tab. Note the server (`smtp-relay.brevo.com`), port `587`, your login
   email, and generate an **SMTP key**.
3. In Supabase: **Authentication → Emails → SMTP settings** → enable custom SMTP and paste those
   values, with the sender name/email set to your verified sender.
4. Supabase **Authentication → Rate Limits** → raise "Emails per hour", so your own SMTP is the
   limit rather than Supabase's shared mailer.
5. Supabase **Authentication → URL Configuration** → set Site URL to your domain and add
   `https://yourdomain.com/auth/callback` under Redirect URLs, or confirmation and password-reset
   links will bounce to localhost.
6. Optional, for the admin outbox: **SMTP & API → API Keys** → create a key, put it in
   `BREVO_API_KEY`, and set `BREVO_SENDER_EMAIL` to your verified sender. Renewal and dispatch
   messages can then be emailed from the outbox in one click.

> **Why the confirmation link bounces to localhost:** it points at `NEXT_PUBLIC_SITE_URL`. Set that
> to your real domain on Vercel, and make sure the same URL is in Supabase's Redirect URLs.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the three environment variables from `.env.local` (set `NEXT_PUBLIC_SITE_URL` to your real domain).
4. Deploy, then point your domain at Vercel.

In Supabase → **Authentication → URL Configuration**, add your production URL to
**Site URL** and **Redirect URLs** (`https://yourdomain.com/auth/callback`), otherwise
confirmation and password-reset emails will bounce back to localhost.

---

## Project structure

```
src/
  app/
    (site)/            storefront (home, plans, library, subscribe, checkout, account…)
    (auth)/            login, register, forgot password
    admin/             the dashboard (protected by role)
    auth/              callback + signout route handlers
    api/proof/[id]/    signed-URL proxy for payment screenshots
    api/admin/         book metadata search for the import screen (admin-only)
    api/cron/          daily maintenance
    layout.tsx         html shell, fonts, metadata
  components/          UI kit, forms, account + admin widgets
  lib/
    actions/           server actions: auth, storefront, admin
    supabase/          browser + server clients (@supabase/ssr)
    auth.ts            session helpers, requireUser / requireAdmin
    data.ts            every read query, degrades gracefully
    format.ts          money / date / slug helpers
  proxy.ts             Next 16 equivalent of middleware: session refresh + route guards
supabase/migrations/   SQL schema, RLS, seed data
```

### How the money flow works

```
customer picks plan + books
        ↓
subscription (pending) + cycle #1 + order (pending_payment) + picks   [server action, prices computed server-side]
        ↓
customer sends bKash/Nagad, submits TrxID  →  payments row (pending)
        ↓
admin clicks "Verify & activate"
        ↓
payment = verified · order = paid · subscription = active (+ dates) · deposit = held · delivery queued
```

Guard triggers in the database stop a customer from faking any of this by calling the
Supabase API directly: they can only cancel their own subscription, and any order or
payment they insert is forced back to `pending`.

---

## Importing books

`/admin/import` offers three ways in, and they all share the same de-duplication
and copy handling:

| Tab | Use it for |
| --- | --- |
| **Search a book** | One title at a time. Type a title, author or ISBN, look at the real covers, then click **Import** — or *Import all* for everything on screen. |
| **Paste / upload CSV** | Spreadsheets and supplier lists. |
| **Open Library bulk** | Subject presets, e.g. *Bangla / Bengali* (`language:ben`), for filling a shelf at a time. |

An import fills in: title, subtitle, author (created if new), genre, description,
publisher, year, pages, language, ISBN and cover.

**Covers are copied into your own `book-covers` bucket** instead of hot-linked, so
the shop keeps working when Open Library is slow — which it regularly is. Open
Library renders cover sizes on demand and some are missing or wedged, so the
importer walks `-L → -M → -S` until one actually delivers bytes.

**Every imported book gets `book_copies` rows** (`slug-01`, `slug-02`, …) matching
its `total_copies`. Without them fulfilment can never hand out a physical copy:
`copy_id` silently stays null and the same title can leave the building again and
again.

Worth knowing:

- Prices are **not** imported — set them in the book form, or via the CSV's `price`
  column.
- New titles arrive **unpublished** unless you tick *Publish immediately*.
- Open Library only indexes Latin letters: search `Humayun Ahmed`, not
  `হুমায়ূন আহমেদ`. For Bangla titles use the bulk tab's *Bangla / Bengali* preset.
- Searching by **ISBN** uses the exact edition record (page count, publisher,
  language). Searching by **title** uses work-level data, which is aggregated across
  every edition and is occasionally wrong — glance before you publish.
- Optional: set `GOOGLE_BOOKS_API_KEY` to merge Google Books results as well (richer
  descriptions). Without a key Google refuses anonymous calls with HTTP 429, so it
  stays switched off.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on :3000 (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (flat config) |

---

## Security notes

- **RLS is on for every table.** Customers see only their own rows; `is_admin()` unlocks the rest.
- Profiles, orders, subscriptions and payments have guard triggers so a crafted API call
  cannot escalate a role, unblock an account, or mark a payment verified.
- Book covers are served from a **public** storage bucket; payment screenshots live in a
  **private** bucket and are only reachable through `/api/proof/[id]`, which checks
  ownership/admin and returns a 5-minute signed URL.
- The admin dashboard is protected twice: `proxy.ts` for signed-out visitors, and
  `requireAdmin()` in the layout for signed-in non-admins.

---

## Next steps worth considering

- Automated payments: SSLCommerz / aamarPay, to replace manual TrxID approval.
- Courier webhooks: Steadfast/Pathao callbacks so a shipment marks itself delivered instead of
  you updating it by hand.
- A debounced server-side search endpoint for the box picker once the catalog outgrows the
  first 24–60 titles it loads today.
- Sitemap + structured data (Book/AggregateOffer) for Google Shopping style listings.
- Multi-copy reservations: `add_to_box()` already refuses a title whose copies are all out, but
  it does not hold a specific copy for a customer until dispatch.
