import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the one-time code in an email link for a real session.
 * Used by sign-up confirmation and password-recovery links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code && supabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/account"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
