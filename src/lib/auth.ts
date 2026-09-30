import { cache } from "react";
import { redirect } from "next/navigation";

import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type Session = {
  userId: string;
  email: string | null;
  profile: Profile | null;
};

/**
 * Resolves the signed-in user and their profile row.
 * Cached per request so multiple components can call it freely.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!supabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      email: user.email ?? null,
      profile: (profile as Profile | null) ?? null,
    };
  } catch {
    return null;
  }
});

export function isAdmin(session: Session | null): boolean {
  return session?.profile?.role === "admin" || session?.profile?.role === "staff";
}

/** Redirects to the login page when there is no session. */
export async function requireUser(nextPath = "/account"): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

/** Redirects non-admins away from the dashboard. */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fadmin");
  if (!isAdmin(session)) redirect("/account?error=not-admin");
  return session;
}
