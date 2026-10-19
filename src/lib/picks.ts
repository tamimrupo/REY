import "server-only";

import { cookies } from "next/headers";

import { MAX_PICKS, PICKS_COOKIE, PICKS_MAX_AGE_SECONDS, parsePicks } from "@/lib/picks-shared";

/** The guest's current box, oldest pick first. */
export async function readPicks(): Promise<string[]> {
  const jar = await cookies();
  return parsePicks(jar.get(PICKS_COOKIE)?.value);
}

/** Replaces the box. Returns the list that was actually written. */
export async function writePicks(ids: string[]): Promise<string[]> {
  const unique = Array.from(new Set(ids)).slice(0, MAX_PICKS);
  const jar = await cookies();

  // The cookie serializer percent-encodes the value itself — do not encode it
  // here, or the client would have to decode twice.
  jar.set(PICKS_COOKIE, JSON.stringify(unique), {
    path: "/",
    maxAge: PICKS_MAX_AGE_SECONDS,
    sameSite: "lax",
  });

  return unique;
}

/** Empties the box (after the order is created). */
export async function clearPicks(): Promise<void> {
  const jar = await cookies();
  jar.delete(PICKS_COOKIE);
}
