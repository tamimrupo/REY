/**
 * Small, shared helpers for meta descriptions. Keeps descriptions inside the
 * 120–155 character band search engines expect (Ahrefs flags <70 as too short
 * and >155 as too long).
 */

/**
 * Collapse whitespace and clip to `maxLength` characters on a word boundary.
 * Returns the input unchanged when it already fits.
 */
export function clipDescription(text: string, maxLength = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  // Prefer ending on a word boundary, but never drop below a sensible floor.
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}
