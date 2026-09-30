import { NextResponse, type NextRequest } from "next/server";

import { getCronSecret } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Daily maintenance: expire finished plans and queue renewal / overdue
 * reminders. Vercel calls this with `Authorization: Bearer $CRON_SECRET`
 * (see vercel.json); you can also hit it by hand with `?secret=…`.
 */
export async function GET(request: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 400 });
  }

  const provided =
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  const expected = await getCronSecret();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "No cron secret found. Re-run migration 0003." },
      { status: 500 },
    );
  }
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("run_maintenance", { p_secret: expected });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
