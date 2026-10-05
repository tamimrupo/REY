import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/env";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env-server";

/** True when a service-role key is present in the environment. */
export const supabaseAdminConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Service-role Supabase client for server-only jobs that must bypass RLS.
 *
 * Import only from server code: the `server-only` guards here and in
 * `env-server.ts` make the build fail if it ever reaches a Client Component.
 * Returns null when the key is not configured, matching `createPublicClient`,
 * so callers can degrade instead of crashing.
 */
export function createAdminClient() {
  if (!supabaseAdminConfigured) return null;

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
