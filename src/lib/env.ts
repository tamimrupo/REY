/**
 * Environment access with safe fallbacks.
 *
 * The app is designed to build and boot even before Supabase is wired up.
 * When the keys are missing `supabaseConfigured` is false and every data
 * loader returns empty results, while the UI shows a friendly setup notice.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const SUPABASE_URL = url || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = anonKey || "placeholder-anon-key";

export const supabaseConfigured = Boolean(url && anonKey);

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

/** Shown on screens that cannot work without a database connection. */
export const SETUP_HINT =
  "Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then run the SQL in supabase/migrations.";
