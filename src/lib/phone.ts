/**
 * Bangladeshi phone numbers arrive in every shape: 01712345678, +8801712345678,
 * 8801712345678, 1712345678. Normalising them lets us answer the question the
 * shop actually cares about: "did this bKash payment come from the number the
 * customer registered with?"
 */

/** Strips everything but digits and returns the full international form. */
export function normalizePhone(raw: string | null | undefined, countryCode = "880"): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const cc = countryCode.replace(/\D/g, "") || "880";
  if (digits.startsWith(cc)) return digits;
  if (digits.startsWith("0")) return cc + digits.slice(1);
  return cc + digits;
}

/**
 * true  = same number
 * false = different numbers
 * null  = not enough information (missing on one side) — treat as "unknown"
 *         rather than alarming the shop with a false mismatch.
 */
export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  countryCode = "880",
): boolean | null {
  const left = normalizePhone(a, countryCode);
  const right = normalizePhone(b, countryCode);
  if (!left || !right) return null;
  if (left === right) return true;
  // Fall back to the last 10 digits so +880 / 880 / 0-prefix variants still match.
  return left.slice(-10) === right.slice(-10);
}

export function formatPhone(raw: string | null | undefined): string {
  const n = normalizePhone(raw);
  if (!n || n.length < 13) return String(raw ?? "—");
  return `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 9)} ${n.slice(9)}`;
}
