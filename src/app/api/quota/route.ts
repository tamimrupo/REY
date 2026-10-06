import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getMembershipState } from "@/lib/data";

/**
 * Lightweight, per-user endpoint the client components call after the page has
 * loaded. Keeps the session/membership reads out of the server render path so
 * storefront pages can be statically cached (ISR) for anonymous visitors and
 * crawlers.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null, state: null });
  }
  const state = await getMembershipState(session.userId);
  return NextResponse.json({ session: { userId: session.userId }, state });
}
