// Canonical origin for the site.
//
// NEXT_PUBLIC_SITE_URL is sometimes set to http:// in local/env config, but the
// site is always served over https. Force https so canonicals, sitemaps and
// robots never emit an http:// URL that would be treated as a duplicate.
const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rey.bd";

export const SITE_URL = raw.replace(/^http:\/\//i, "https://").replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
