/**
 * Server-only environment access.
 *
 * `env.ts` is the public-safe module: only NEXT_PUBLIC_* values may travel
 * through it to the browser. This module holds credentials that grant full
 * control of the database, so it must only be imported from server code
 * (Server Components, Server Actions, Route Handlers, the cron route).
 *
 * The `server-only` guard below makes the build fail if a Client Component
 * ever imports it. Next.js ships its own copy — nothing to install.
 */

import "server-only";

/**
 * Master key. Ignores every Row Level Security policy, so treat it like the
 * database password: server only, never NEXT_PUBLIC_, never in client code.
 */
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

/**
 * Raw Postgres connection string, used by outside tools (psql, an ORM,
 * `npm run db`). The web app itself never dials it directly — it reaches
 * Postgres through the Supabase API in `src/lib/supabase/`.
 */
export const DATABASE_URL =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";
