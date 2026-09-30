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

In the Supabase dashboard open the **SQL Editor** and run, in order:

| File | What it does |
| --- | --- |
| `supabase/migrations/0001_init.sql` | Tables, enums, RLS policies, guard triggers, storage buckets, analytics function |
| `supabase/migrations/0002_seed.sql` | 3 plans, 16 genres, 16 starter books, 8 CMS pages, default settings |

Both files are safe to re-run.

> If you have the Supabase CLI and Docker instead: `supabase db push`.

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

- Renewal automation: a Supabase cron (`pg_cron`) that rolls cycles over and creates renewal
  orders when `next_billing_date` arrives.
- SSLCommerz / aamarPay integration to replace manual verification with automated payments.
- SMS/email notifications when a box is dispatched (Steadfast has a webhook).
- Library import: bulk-add books from a CSV or an Open Library export.
- Replace the 60-title picker with a debounced search endpoint once the catalog grows.
