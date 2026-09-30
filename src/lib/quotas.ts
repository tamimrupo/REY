import type {
  CourierMethod,
  CourierSettings,
  Rental,
  RentalStatus,
  ShipmentType,
} from "@/lib/types";

export const COURIER_KEYS = ["steadfast", "pathao", "redx", "other"] as const;

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  outbound: "First delivery",
  swap: "Swap",
  return: "Return pickup",
};

export const SHIPMENT_STATUS_FLOW = [
  "pending",
  "awaiting_post",
  "packed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
] as const;

/**
 * Mirrors `public.courier_customer_charge()` in SQL, so the number a customer
 * sees on screen is the same number the database will charge.
 *
 * Every courier has a total charge and a percentage the customer covers; the
 * shop absorbs the rest. BD Post is a flat (usually free) postal option.
 */
export function quoteCourier(
  couriers: CourierSettings,
  courierKey: string,
  trip: ShipmentType = "outbound",
): {
  key: string;
  label: string;
  total: number;
  customer_charge: number;
  merchant_charge: number;
  percent: number;
  note: string;
} {
  if (courierKey === "bdpost") {
    const total = Number(couriers.bdpost?.charge ?? 0);
    return {
      key: "bdpost",
      label: couriers.bdpost?.label ?? "BD Post",
      total,
      customer_charge: total,
      merchant_charge: 0,
      percent: 100,
      note: "Book Post — free or low cost when the postal rules are followed.",
    };
  }

  const method: CourierMethod | undefined = couriers.methods.find((m) => m.key === courierKey);
  if (!method) {
    return quoteCourier(couriers, "steadfast", trip);
  }

  const total =
    trip === "return" && method.return_charge !== null && method.return_charge !== undefined
      ? Number(method.return_charge)
      : Number(method.charge ?? 0);

  const percent = Math.min(100, Math.max(0, Number(method.percent ?? 100)));
  const customer_charge = Math.round(total * (percent / 100) * 100) / 100;

  return {
    key: method.key,
    label: method.label,
    total,
    customer_charge,
    merchant_charge: Math.round((total - customer_charge) * 100) / 100,
    percent,
    note:
      percent === 100
        ? "You pay the full courier charge."
        : `You pay ${percent}% of the courier charge.`,
  };
}

/** Courier choices offered for a given trip. */
export function couriersFor(
  couriers: CourierSettings,
  trip: ShipmentType,
): { key: string; label: string; charge: number; note: string }[] {
  const list = couriers.methods
    .filter((method) => method.key !== "other" || true)
    .map((method) => {
      const quote = quoteCourier(couriers, method.key, trip);
      return {
        key: method.key,
        label: method.label,
        charge: quote.customer_charge,
        note: quote.note,
      };
    });

  // BD Post is a return-only option (Book Post rules apply).
  if (trip === "return") {
    const quote = quoteCourier(couriers, "bdpost", "return");
    list.push({
      key: "bdpost",
      label: couriers.bdpost?.label ?? "BD Post",
      charge: quote.customer_charge,
      note: quote.note,
    });
  }

  return list;
}

/* -------------------------------------------------------------------------- */
/* Quota accounting                                                           */
/* -------------------------------------------------------------------------- */

/**
 * How many of the plan's monthly slots are used.
 * Only rentals opened during the current period count, so each new month
 * starts fresh — exactly like the WordPress plugin's `count_this_cycle()`.
 */
export function usedSlots(rentals: Rental[], periodStart: string | null | undefined): number {
  const start = periodStart ? new Date(periodStart).getTime() : 0;
  return rentals.filter((rental) => {
    if (!["pending", "out", "returning"].includes(rental.status)) return false;
    const created = new Date(rental.created_at).getTime();
    return Number.isNaN(start) || created >= start;
  }).length;
}

export function remainingSlots(
  rentals: Rental[],
  quota: number,
  periodStart: string | null | undefined,
): number {
  return Math.max(0, quota - usedSlots(rentals, periodStart));
}

export function booksOut(rentals: Rental[]): Rental[] {
  return rentals.filter((rental) => ["out", "returning"].includes(rental.status));
}

export function boxBooks(rentals: Rental[]): Rental[] {
  return rentals.filter((rental) => rental.status === "pending");
}

export function isOverdue(rental: Rental): boolean {
  if (!["out", "returning"].includes(rental.status)) return false;
  if (!rental.due_at) return false;
  return new Date(rental.due_at).getTime() < Date.now();
}

export function hasOverdue(rentals: Rental[]): boolean {
  return rentals.some(isOverdue);
}

/** Days until the period ends (negative when it already ended). */
export function daysLeft(end: string | null | undefined): number | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

/** True when books from an earlier month are still out — a swap trip. */
export function isNewCycleSwap(
  rentals: Rental[],
  periodStart: string | null | undefined,
): boolean {
  const start = periodStart ? new Date(periodStart).getTime() : 0;
  return rentals.some((rental) => {
    if (rental.status !== "out") return false;
    const stamp = new Date(rental.checked_out_at ?? rental.created_at).getTime();
    return !Number.isNaN(start) && stamp < start;
  });
}

export function rentalStatusLabel(status: RentalStatus | string): string {
  const labels: Record<string, string> = {
    pending: "In box",
    out: "With you",
    returning: "Coming back",
    returned: "Returned",
    lost: "Lost",
    cancelled: "Cancelled",
  };
  return labels[status] ?? String(status);
}

/** Builds a wa.me link, normalising Bangladeshi numbers to +880. */
export function whatsappLink(phone: string | null | undefined, message: string, countryCode = "880"): string | null {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const cc = countryCode.replace(/\D/g, "") || "880";
  let normalized = digits;
  if (!normalized.startsWith(cc)) {
    normalized = normalized.startsWith("0")
      ? cc + normalized.slice(1)
      : cc + normalized;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Fills {name}, {plan}, {books}, … placeholders in a message template. */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(String(value));
  }
  return out;
}
