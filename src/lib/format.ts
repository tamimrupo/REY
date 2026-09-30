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

export function slugify(input: string): string {
  return input
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

/** Colour class for a status pill. */
export function statusTone(status: string): string {
  const green = ["active", "paid", "verified", "delivered", "completed", "published", "available", "held"];
  const amber = ["pending", "pending_payment", "selecting", "sourcing", "packed", "dispatched", "in_transit", "confirmed", "reserved", "draft"];
  const red = ["cancelled", "rejected", "expired", "failed", "lost", "forfeited", "blocked", "returned"];
  const blue = ["refunded", "shipped", "out_for_delivery", "processing", "maintenance"];

  if (green.includes(status)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (amber.includes(status)) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (red.includes(status)) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (blue.includes(status)) return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-zinc-100 text-zinc-600 ring-zinc-200";
}

export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
