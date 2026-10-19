/**
 * Guest "box" cookie helpers shared by server code and client components.
 *
 * The box is a shortlist of book IDs kept in a normal (non-HttpOnly) cookie so
 * the statically cached book pages can read and update it on the client without
 * turning every page dynamic. There is nothing secret in it.
 */

export const PICKS_COOKIE = "rey_picks";

/** The largest plan holds eight books, so the box never needs more. */
export const MAX_PICKS = 8;

/** Cookie lifetime — a month is long enough to finish a shopping session. */
export const PICKS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Parses a raw cookie value into a clean, deduplicated list of book IDs. */
export function parsePicks(raw: string | undefined | null): string[] {
  if (!raw) return [];

  let value = raw;

  // `document.cookie` hands back a percent-encoded value, while the server
  // cookie API may already have decoded it — try both before giving up.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      const ids = parsed.filter(
        (entry): entry is string => typeof entry === "string" && entry.length > 0,
      );

      return Array.from(new Set(ids)).slice(0, MAX_PICKS);
    } catch {
      try {
        value = decodeURIComponent(value);
      } catch {
        return [];
      }
    }
  }

  return [];
}

/** Reads the box from `document.cookie` (client components only). */
export function readPicksFromCookieString(cookieString: string): string[] {
  if (!cookieString) return [];

  const prefix = `${PICKS_COOKIE}=`;
  const part = cookieString
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(prefix));

  return part ? parsePicks(part.slice(prefix.length)) : [];
}
