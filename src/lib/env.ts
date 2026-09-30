/**
 * Environment access with safe fallbacks.
 *
 * The app is designed to build and boot even before Supabase is wired up.
 * When the keys are missing `supabaseConfigured` is false and every data
 * loader returns empty results, while the UI shows a friendly setup notice.
 *
 * Supabase renamed their client key: older projects call it the `anon` key,
 * newer ones issue a `publishable` key (`sb_publishable_…`). Both work — we
 * accept either variable name.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const clientKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  "";

export const SUPABASE_URL = url || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = clientKey || "placeholder-client-key";

export const supabaseConfigured = Boolean(url && clientKey);

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

/** Shown on screens that cannot work without a database connection. */
export const SETUP_HINT =
  "Supabase is not connected yet. Put your Project URL and publishable (anon) key in .env.local, then run the SQL files in supabase/migrations in order.";
