/**
 * "Changes every day" helpers for the home-page shelf.
 *
 * These deliberately read the clock. The home page is a dynamic server route, so
 * the values are computed once per request on the server and handed to the shelf
 * as props — they are never evaluated during a client render, so there is nothing
 * for hydration to mismatch on. Keeping the clock read out of the component file
 * also keeps React's purity lint happy without disabling it.
 */

/**
 * Days since the epoch, shifted so the day flips at midnight in Dhaka (UTC+6)
 * rather than at 06:00 local, which is what a plain UTC rollover would give.
 */
export function dhakaDayIndex(now: number = Date.now()): number {
  return Math.floor((now + 6 * 3_600_000) / 86_400_000);
}

/** Returns today's entry from a list — same list, a different item each day. */
export function pickForToday<T>(items: T[], dayIndex: number): T {
  const index = ((dayIndex % items.length) + items.length) % items.length;
  return items[index] as T;
}

/** Rotates a list so a different item leads each day, keeping the order intact. */
export function rotateForToday<T>(items: T[], dayIndex: number): T[] {
  if (items.length < 2) return items;
  const by = ((dayIndex % items.length) + items.length) % items.length;
  return [...items.slice(by), ...items.slice(0, by)];
}
