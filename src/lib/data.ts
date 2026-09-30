import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_DELIVERY,
  DEFAULT_PAYMENTS,
  DEFAULT_SITE,
  type Address,
  type Author,
  type Book,
  type CmsPage,
  type DashboardStats,
  type DeliverySettings,
  type Deposit,
  type Genre,
  type Order,
  type Payment,
  type PaymentSettings,
  type Plan,
  type PlanFeature,
  type Profile,
  type RareRequest,
  type SiteSettings,
  type Subscription,
  type SubscriptionCycle,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Runs a Supabase query and degrades to a fallback when anything fails. */
async function query<T>(run: (sb: any) => PromiseLike<{ data: any; error: any }>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    const supabase = await createClient();
    const { data, error } = await run(supabase);
    if (error) {
      console.error("[rey] query error:", error.message);
      return fallback;
    }
    return (data ?? fallback) as T;
  } catch (error) {
    console.error("[rey] query threw:", error);
    return fallback;
  }
}

/**
 * For data loaders that need custom logic (joins, pagination counts).
 * The callback returns the finished value and should throw on error.
 */
async function compute<T>(run: (sb: any) => Promise<T>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    const supabase = await createClient();
    return await run(supabase);
  } catch (error) {
    console.error("[rey] query threw:", error);
    return fallback;
  }
}

const BOOK_SELECT = "*, authors(name), genres(name)";
const BOOK_SELECT_LIST = "id, title, slug, cover_url, language, rarity, is_active, total_copies, published_year, author_id, genre_id, authors(name), genres(name)";

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await query<any[]>(
    (sb) => sb.from("settings").select("value").eq("key", key).maybeSingle(),
    [] as any,
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  return ((row?.value as T) ?? fallback) as T;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const value = await getSetting<Partial<SiteSettings>>("site", {});
  return { ...DEFAULT_SITE, ...value };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const value = await getSetting<Partial<PaymentSettings>>("payments", {});
  return {
    ...DEFAULT_PAYMENTS,
    ...value,
    methods: value.methods?.length ? value.methods : DEFAULT_PAYMENTS.methods,
  };
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const value = await getSetting<Partial<DeliverySettings>>("delivery", {});
  return {
    ...DEFAULT_DELIVERY,
    ...value,
    methods: value.methods?.length ? value.methods : DEFAULT_DELIVERY.methods,
  };
}

export async function getAnnouncement(): Promise<{ enabled: boolean; text: string }> {
  return getSetting("announcement", { enabled: false, text: "" });
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await query<any[]>((sb) => sb.from("settings").select("key, value"), []);
  const out: Record<string, unknown> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                     */
/* -------------------------------------------------------------------------- */

export async function getPlans(onlyActive = true): Promise<Plan[]> {
  return query<Plan[]>(
    (sb) => {
      let q = sb.from("plans").select("*").order("sort_order");
      if (onlyActive) q = q.eq("is_active", true);
      return q;
    },
    [],
  );
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  return query<Plan | null>(
    (sb) => sb.from("plans").select("*").eq("slug", slug).maybeSingle(),
    null,
  );
}

export async function getPlanFeatures(): Promise<PlanFeature[]> {
  return query<PlanFeature[]>(
    (sb) => sb.from("plan_features").select("*").order("sort_order"),
    [],
  );
}

export async function getGenres(): Promise<Genre[]> {
  return query<Genre[]>((sb) => sb.from("genres").select("*").order("sort_order"), []);
}

export async function getAuthors(): Promise<Author[]> {
  return query<Author[]>((sb) => sb.from("authors").select("*").order("name"), []);
}

export type BookFilters = {
  q?: string;
  genre?: string;
  language?: string;
  rarity?: string;
  page?: number;
  perPage?: number;
  includeInactive?: boolean;
  onlyRare?: boolean;
  sort?: string;
};

export async function listBooks(filters: BookFilters = {}): Promise<{
  books: Book[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(6, filters.perPage ?? 24));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const empty = { books: [] as Book[], total: 0, page, perPage, pages: 0 };

  return compute(async (sb) => {
      let q = sb
        .from("books")
        .select(BOOK_SELECT_LIST, { count: "exact" })
        .order("title", { ascending: true })
        .range(from, to);

      if (!filters.includeInactive) q = q.eq("is_active", true);
      if (filters.onlyRare) q = q.eq("rarity", "rare");
      if (filters.genre) {
        const genre = await sb.from("genres").select("id").eq("slug", filters.genre).maybeSingle();
        q = q.eq("genre_id", genre?.data?.id ?? "00000000-0000-0000-0000-000000000000");
      }
      if (filters.language) q = q.eq("language", filters.language);
      if (filters.rarity) q = q.eq("rarity", filters.rarity);
      if (filters.q) q = q.ilike("title", `%${filters.q}%`);

      const { data, count, error } = await q;
      if (error) throw new Error(error.message);

      const total = count ?? 0;
      return {
        books: (data ?? []) as Book[],
        total,
        page,
        perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    empty,
  );
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  return query<Book | null>(
    (sb) => sb.from("books").select(BOOK_SELECT).eq("slug", slug).maybeSingle(),
    null,
  );
}

export async function getBookById(id: string): Promise<Book | null> {
  return query<Book | null>(
    (sb) => sb.from("books").select(BOOK_SELECT).eq("id", id).maybeSingle(),
    null,
  );
}

export async function getLanguages(): Promise<string[]> {
  const rows = await query<{ language: string | null }[]>(
    (sb) => sb.from("books").select("language").eq("is_active", true),
    [],
  );
  return Array.from(new Set(rows.map((r) => r.language).filter(Boolean) as string[])).sort();
}

/* -------------------------------------------------------------------------- */
/* Customer data                                                               */
/* -------------------------------------------------------------------------- */

export async function getAddresses(userId: string): Promise<Address[]> {
  return query<Address[]>(
    (sb) => sb.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false }),
    [],
  );
}

export async function getMySubscriptions(userId: string): Promise<Subscription[]> {
  return query<Subscription[]>(
    (sb) =>
      sb
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  return query<Subscription | null>(
    (sb) =>
      sb
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", userId)
        .in("status", ["active", "pending", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    null,
  );
}

export async function getCycles(subscriptionId: string): Promise<SubscriptionCycle[]> {
  return query<SubscriptionCycle[]>(
    (sb) =>
      sb
        .from("subscription_cycles")
        .select("*, cycle_picks(*, books(id, title, slug, cover_url, authors(name)))")
        .eq("subscription_id", subscriptionId)
        .order("cycle_number", { ascending: false }),
    [],
  );
}

export async function getSelectingCycle(subscriptionId: string): Promise<SubscriptionCycle | null> {
  return query<SubscriptionCycle | null>(
    (sb) =>
      sb
        .from("subscription_cycles")
        .select("*, cycle_picks(*, books(id, title, slug, cover_url, authors(name)))")
        .eq("subscription_id", subscriptionId)
        .eq("status", "selecting")
        .order("cycle_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
    null,
  );
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  return query<Order[]>(
    (sb) =>
      sb
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

export async function getMyPayments(userId: string): Promise<Payment[]> {
  return query<Payment[]>(
    (sb) => sb.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getMyDeposits(userId: string): Promise<Deposit[]> {
  return query<Deposit[]>(
    (sb) => sb.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getMyRequests(userId: string): Promise<RareRequest[]> {
  return query<RareRequest[]>(
    (sb) => sb.from("rare_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* Admin data                                                                  */
/* -------------------------------------------------------------------------- */

export async function getDashboardStats(): Promise<DashboardStats> {
  const fallback: DashboardStats = {
    active_subscriptions: 0,
    pending_subscriptions: 0,
    customers: 0,
    pending_payments: 0,
    open_requests: 0,
    titles: 0,
    held_deposits: 0,
    mrr: 0,
  };
  const stats = await query<DashboardStats | null>(
    (sb) => sb.rpc("admin_dashboard_stats"),
    null,
  );
  return stats ? { ...fallback, ...stats } : fallback;
}

export async function getRecentOrders(limit = 8): Promise<Order[]> {
  return query<Order[]>(
    (sb) =>
      sb
        .from("orders")
        .select("*, profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(limit),
    [],
  );
}

export async function listOrders(status?: string): Promise<Order[]> {
  return query<Order[]>(
    (sb) => {
      let q = sb
        .from("orders")
        .select("*, profiles(full_name, phone, role), order_items(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function getOrder(id: string): Promise<Order | null> {
  return query<Order | null>(
    (sb) =>
      sb
        .from("orders")
        .select("*, profiles(*), order_items(*), addresses(*), deliveries(*), payments(*)")
        .eq("id", id)
        .maybeSingle(),
    null,
  );
}

export async function listSubscriptions(status?: string): Promise<Subscription[]> {
  return query<Subscription[]>(
    (sb) => {
      let q = sb
        .from("subscriptions")
        .select("*, plans(*), profiles(full_name, phone, role)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function listPayments(status?: string): Promise<Payment[]> {
  return query<Payment[]>(
    (sb) => {
      let q = sb
        .from("payments")
        .select("*, orders(order_number, total, type), profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function listDeposits(status?: string): Promise<Deposit[]> {
  return query<Deposit[]>(
    (sb) => {
      let q = sb
        .from("deposits")
        .select("*, profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function listDeliveries(): Promise<any[]> {
  return query<any[]>(
    (sb) =>
      sb
        .from("deliveries")
        .select("*, orders(order_number), subscriptions(id)")
        .order("created_at", { ascending: false })
        .limit(200),
    [],
  );
}

export async function listRareRequests(status?: string): Promise<RareRequest[]> {
  return query<RareRequest[]>(
    (sb) => {
      let q = sb
        .from("rare_requests")
        .select("*, profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function listCustomers(q?: string): Promise<Profile[]> {
  return query<Profile[]>(
    (sb) => {
      let queryBuilder = sb
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q) queryBuilder = queryBuilder.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
      return queryBuilder;
    },
    [],
  );
}

export async function getCustomer(id: string): Promise<Profile | null> {
  return query<Profile | null>((sb) => sb.from("profiles").select("*").eq("id", id).maybeSingle(), null);
}

export async function getCustomerOrders(userId: string): Promise<Order[]> {
  return query<Order[]>(
    (sb) => sb.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getCustomerPayments(userId: string): Promise<Payment[]> {
  return query<Payment[]>(
    (sb) => sb.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getCustomerDeposits(userId: string): Promise<Deposit[]> {
  return query<Deposit[]>(
    (sb) => sb.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getCustomerSubscriptions(userId: string): Promise<Subscription[]> {
  return query<Subscription[]>(
    (sb) => sb.from("subscriptions").select("*, plans(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* CMS                                                                         */
/* -------------------------------------------------------------------------- */

export async function getCmsPages(includeDrafts = false): Promise<CmsPage[]> {
  return query<CmsPage[]>(
    (sb) => {
      let q = sb.from("cms_pages").select("*").order("sort_order");
      if (!includeDrafts) q = q.eq("status", "published");
      return q;
    },
    [],
  );
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  return query<CmsPage | null>(
    (sb) => sb.from("cms_pages").select("*").eq("slug", slug).maybeSingle(),
    null,
  );
}

export async function getCmsPageById(id: string): Promise<CmsPage | null> {
  return query<CmsPage | null>((sb) => sb.from("cms_pages").select("*").eq("id", id).maybeSingle(), null);
}
