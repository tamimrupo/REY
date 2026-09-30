import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/env";

/**
 * Cookie-less Supabase client for public reads.
 *
 * The normal server client goes through `cookies()`, which marks a route as
 * dynamic. That is fine for the storefront (which is dynamic anyway) but it
 * breaks routes that must stay static — `/ _not-found` in particular, since the
 * root layout renders metadata through it. Use this for public data there.
 */
export function createPublicClient() {
  if (!supabaseConfigured) return null;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
