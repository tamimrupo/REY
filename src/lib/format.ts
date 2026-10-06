import { hasBengaliScript, transliterateBengali } from "@/lib/bengali";

export const CURRENCY = "৳";

export function money(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${CURRENCY}${safe.toLocaleString("en-BD", {
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(value)} · ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Series names are matched case-insensitively (and with LIKE), so strip the
 * wildcard characters and collapse whitespace before storing one.
 */
export function seriesName(value: string | null | undefined): string | null {
  const clean = String(value ?? "")
    .replace(/[%_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean ? clean.slice(0, 80) : null;
}

export function slugify(input: string): string {
  // Bengali titles have no Latin letters to slug, so a raw pass leaves an empty
  // string and the caller falls back to "book-<timestamp>". Transliterate first
  // — চাঁদের পাহাড় becomes chander-pahar.
  const text = hasBengaliScript(input) ? transliterateBengali(input) : input;
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/**
 * Colour class for a status pill — monochrome only, so meaning is carried by
 * fill rather than hue:
 *   filled black  = done / good  (active, paid, verified, delivered)
 *   outlined      = in progress  (pending, packed, shipped, confirmed)
 *   grey + ring   = problem      (cancelled, rejected, failed, lost, overdue)
 *   light grey    = neutral / informational
 */
export function statusTone(status: string): string {
  const good = [
    "active",
    "paid",
    "verified",
    "delivered",
    "completed",
    "published",
    "available",
    "held",
    "sent",
  ];
  const problem = [
    "cancelled",
    "rejected",
    "expired",
    "failed",
    "lost",
    "forfeited",
    "blocked",
    "returned",
    "overdue",
  ];
  const progress = [
    "pending",
    "pending_payment",
    "selecting",
    "sourcing",
    "packed",
    "dispatched",
    "in_transit",
    "confirmed",
    "reserved",
    "draft",
    "awaiting_post",
    "processing",
    "shipped",
    "out_for_delivery",
    "maintenance",
    "refunded",
    "queued",
    "manual",
  ];

  if (good.includes(status)) return "tone-good";
  if (problem.includes(status)) return "tone-problem";
  if (progress.includes(status)) return "tone-progress";
  return "tone-neutral";
}

export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
