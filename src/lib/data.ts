import { unstable_cache } from "next/cache";

import { supabaseConfigured } from "@/lib/env";
import {
  booksOut,
  boxBooks,
  hasOverdue,
  remainingSlots,
  usedSlots,
} from "@/lib/quotas";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import {
  DEFAULT_COURIERS,
  DEFAULT_PAYMENTS,
  DEFAULT_RENTAL,
  DEFAULT_SITE,
  DEFAULT_WAREHOUSE,
  DEFAULT_WHATSAPP,
  type Address,
  type AppNotification,
  type Author,
  type Book,
  type CmsPage,
  type CourierSettings,
  type DashboardStats,
  type Deposit,
  type Genre,
  type Order,
  type Payment,
  type PaymentSettings,
  type Plan,
  type PlanFeature,
  type Profile,
  type RareRequest,
  type Rental,
  type RentalSettings,
  type ShelfBook,
  type Shipment,
  type SiteSettings,
  type Subscription,
  type WarehouseSettings,
  type WhatsappSettings,
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
 * For data loaders that need custom logic (joins, counts, pagination).
 * The callback returns the finished value and should throw on error.
 */
/**
 * Cookie-less variants for public catalog/settings reads. `createClient()`
 * goes through `cookies()`, which marks a route dynamic; public data does not
 * need a user session, so these let storefront pages render statically (ISR).
 */
async function queryPublic<T>(run: (sb: any) => PromiseLike<{ data: any; error: any }>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    const supabase = createPublicClient();
    if (!supabase) return fallback;
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

async function computePublic<T>(run: (sb: any) => Promise<T>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    const supabase = createPublicClient();
    if (!supabase) return fallback;
    return await run(supabase);
  } catch (error) {
    console.error("[rey] query threw:", error);
    return fallback;
  }
}

const BOOK_SELECT = "*, authors(name, slug, avatar_url, bio), genres(name)";
const BOOK_SELECT_LIST =
  "id, title, slug, cover_url, language, rarity, demand, is_active, total_copies, published_year, series, series_order, author_id, genre_id, authors(name), genres(name)";
const RENTAL_SELECT = "*, books(id, title, slug, cover_url, authors(name))";
const SHIPMENT_SELECT =
  "*, profiles(full_name, phone), addresses(*), orders(order_number), shipment_items(*, rentals(*, books(id, title, slug, cover_url, authors(name))))";

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await query<any>(
    (sb) => sb.from("settings").select("value").eq("key", key).maybeSingle(),
    null,
  );
  const value = Array.isArray(row) ? row[0]?.value : row?.value;
  return ((value as T) ?? fallback) as T;
}

/** Cookie-less settings read for public values (site name, couriers, …). */
export async function getPublicSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await queryPublic<any>(
    (sb) => sb.from("settings").select("value").eq("key", key).maybeSingle(),
    null,
  );
  const value = Array.isArray(row) ? row[0]?.value : row?.value;
  return ((value as T) ?? fallback) as T;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return { ...DEFAULT_SITE, ...(await getPublicSetting<Partial<SiteSettings>>("site", {})) };
}

/**
 * Public, cookie-less read used by the root layout's metadata. Keeping this off
 * the cookie-bound client lets `/_not-found` stay statically prerendered.
 *
 * Cached because the metadata now blocks rendering (see htmlLimitedBots in
 * next.config.ts): a settings change shows on the site immediately and in the
 * page's <head> within five minutes.
 */
export const getSiteSettingsForMetadata = unstable_cache(
  async (): Promise<SiteSettings> => {
    const client = createPublicClient();
    if (!client) return DEFAULT_SITE;

    try {
      const { data } = await client.from("settings").select("value").eq("key", "site").maybeSingle();
      return { ...DEFAULT_SITE, ...((data?.value as Partial<SiteSettings>) ?? {}) };
    } catch {
      return DEFAULT_SITE;
    }
  },
  ["site-settings-for-metadata"],
  { revalidate: 300 },
);

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const value = await getSetting<Partial<PaymentSettings>>("payments", {});
  return {
    ...DEFAULT_PAYMENTS,
    ...value,
    methods: value.methods?.length ? value.methods : DEFAULT_PAYMENTS.methods,
  };
}

export async function getCourierSettings(): Promise<CourierSettings> {
  const value = await getPublicSetting<Partial<CourierSettings>>("couriers", {});
  return {
    methods: value.methods?.length ? value.methods : DEFAULT_COURIERS.methods,
    bdpost: { ...DEFAULT_COURIERS.bdpost, ...(value.bdpost ?? {}) },
  };
}

export async function getRentalSettings(): Promise<RentalSettings> {
  return { ...DEFAULT_RENTAL, ...(await getSetting<Partial<RentalSettings>>("rental", {})) };
}

export async function getWhatsappSettings(): Promise<WhatsappSettings> {
  return { ...DEFAULT_WHATSAPP, ...(await getSetting<Partial<WhatsappSettings>>("whatsapp", {})) };
}

export async function getWarehouseSettings(): Promise<WarehouseSettings> {
  return { ...DEFAULT_WAREHOUSE, ...(await getSetting<Partial<WarehouseSettings>>("warehouse", {})) };
}

export async function getAnnouncement(): Promise<{ enabled: boolean; text: string }> {
  return getPublicSetting("announcement", { enabled: false, text: "" });
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await query<any[]>((sb) => sb.from("settings").select("key, value"), []);
  const out: Record<string, unknown> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export async function getCronSecret(): Promise<string> {
  const system = await getSetting<{ cron_secret?: string }>("system", {});
  return system.cron_secret ?? "";
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                     */
/* -------------------------------------------------------------------------- */

export async function getPlans(onlyActive = true): Promise<Plan[]> {
  return queryPublic<Plan[]>((sb) => {
    let q = sb.from("plans").select("*").order("sort_order");
    if (onlyActive) q = q.eq("is_active", true);
    return q;
  }, []);
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  return queryPublic<Plan | null>(
    (sb) => sb.from("plans").select("*").eq("slug", slug).maybeSingle(),
    null,
  );
}

export async function getPlanById(id: string): Promise<Plan | null> {
  return queryPublic<Plan | null>((sb) => sb.from("plans").select("*").eq("id", id).maybeSingle(), null);
}

export async function getPlanFeatures(): Promise<PlanFeature[]> {
  return queryPublic<PlanFeature[]>((sb) => sb.from("plan_features").select("*").order("sort_order"), []);
}

export async function getGenres(): Promise<Genre[]> {
  return queryPublic<Genre[]>((sb) => sb.from("genres").select("*").order("sort_order"), []);
}

export async function getAuthors(): Promise<Author[]> {
  return queryPublic<Author[]>((sb) => sb.from("authors").select("*").order("name"), []);
}

/** One author, by the slug in their page URL. */
export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  return queryPublic<Author | null>(
    (sb) => sb.from("authors").select("*").eq("slug", slug).maybeSingle(),
    null,
  );
}

export type BookFilters = {
  q?: string;
  genre?: string;
  language?: string;
  rarity?: string;
  demand?: string;
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

  return computePublic(
    async (sb) => {
      let q = sb
        .from("books")
        .select(BOOK_SELECT_LIST, { count: "exact" })
        .order("title", { ascending: true })
        .range(from, to);

      if (!filters.includeInactive) q = q.eq("is_active", true);
      if (filters.onlyRare) q = q.eq("rarity", "rare");
      if (filters.demand) q = q.eq("demand", filters.demand);
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
  return queryPublic<Book | null>(
    (sb) => sb.from("books").select(BOOK_SELECT).eq("slug", slug).maybeSingle(),
    null,
  );
}

/**
 * Books for the home-page shelf, with descriptions, author photos and a real
 * borrow count so the panel beside the rail can follow the active book and the
 * "most borrowed" ranking is genuine rather than decorative.
 */
export async function getShelfBooks(
  limit = 14,
): Promise<{ books: ShelfBook[]; total: number }> {
  const counts = await queryPublic<{ book_id: string; borrowed: number }[]>(
    (sb) => sb.rpc("book_borrow_counts"),
    [],
  );

  const borrowedByBook = new Map<string, number>();
  for (const row of Array.isArray(counts) ? counts : []) {
    borrowedByBook.set(row.book_id, Number(row.borrowed));
  }

  const result = await computePublic<{ books: Book[]; total: number }>(
    async (sb) => {
      const { data, count, error } = await sb
        .from("books")
        .select(BOOK_SELECT, { count: "exact" })
        .eq("is_active", true)
        .order("title", { ascending: true })
        .limit(Math.min(30, Math.max(4, limit)));
      if (error) throw new Error(error.message);
      return { books: (data ?? []) as Book[], total: count ?? 0 };
    },
    { books: [] as Book[], total: 0 },
  );

  return {
    books: result.books.map((book) => ({
      ...book,
      borrowed: borrowedByBook.get(book.id) ?? 0,
    })),
    total: result.total,
  };
}

/**
 * The other titles we hold by one author — used by the author card on every
 * book page.
 */
export async function getAuthorTitles(
  authorId: string,
  excludeBookId?: string,
  limit = 6,
): Promise<Book[]> {
  return computePublic(
    async (sb) => {
      const { data, error } = await sb
        .from("books")
        .select(BOOK_SELECT_LIST)
        .eq("is_active", true)
        .eq("author_id", authorId)
        .order("title", { ascending: true })
        .limit(limit + 1);
      if (error) throw new Error(error.message);
      return ((data ?? []) as Book[])
        .filter((book) => book.id !== excludeBookId)
        .slice(0, limit);
    },
    [] as Book[],
  );
}

/* -------------------------------------------------------------------------- */
/* Series & suggestions                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Every book we hold in one series, in reading order: known positions first,
 * then the rest by year. Series names match case-insensitively.
 */
export async function getSeriesBooks(series: string, limit = 24): Promise<Book[]> {
  const name = series?.trim();
  if (!name) return [];

  return computePublic(
    async (sb) => {
      const { data, error } = await sb
        .from("books")
        .select(BOOK_SELECT_LIST)
        .eq("is_active", true)
        .ilike("series", name)
        .order("series_order", { ascending: true, nullsFirst: false })
        .order("published_year", { ascending: true, nullsFirst: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Book[];
    },
    [] as Book[],
  );
}

/** Other titles on the same shelf — the last rung of the suggestion ladder. */
export async function getGenreBooks(genreId: string, excludeId: string, limit = 4): Promise<Book[]> {
  return computePublic(
    async (sb) => {
      const { data, error } = await sb
        .from("books")
        .select(BOOK_SELECT_LIST)
        .eq("is_active", true)
        .eq("genre_id", genreId)
        .neq("id", excludeId)
        .order("title", { ascending: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Book[];
    },
    [] as Book[],
  );
}

export type ReadNextSection = {
  title: string;
  hint?: string;
  books: Book[];
};

/**
 * The "read this next" ladder on a book page: finish the series first, then the
 * author's other titles, then the shelf it sits on. Every suggestion is real
 * catalogue data — nothing randomised, nothing invented.
 */
export async function getReadNext(book: Book, perSection = 4): Promise<ReadNextSection[]> {
  const sections: ReadNextSection[] = [];
  const seen = new Set<string>([book.id]);
  const fresh = (books: Book[]) => books.filter((item) => !seen.has(item.id)).slice(0, perSection);
  const remember = (books: Book[]) => books.forEach((item) => seen.add(item.id));

  const order = book.series_order;

  if (book.series) {
    const inSeries = (await getSeriesBooks(book.series)).filter((item) => item.id !== book.id);
    // With a known position, offer what comes after; otherwise the whole series.
    const nextUp =
      order != null
        ? inSeries.filter((item) => item.series_order == null || item.series_order > order)
        : [];
    const pick = fresh(nextUp.length ? nextUp : inSeries);

    if (pick.length) {
      sections.push({
        title: nextUp.length
          ? `Next in the ${book.series} series`
          : `More in the ${book.series} series`,
        hint: order != null ? `You are on book ${order}` : undefined,
        books: pick,
      });
      remember(pick);
    }
  }

  if (book.author_id) {
    const titles = await getAuthorTitles(book.author_id, undefined, 8);
    const pick = fresh(titles);
    if (pick.length) {
      sections.push({ title: `More by ${book.authors?.name ?? "this author"}`, books: pick });
      remember(pick);
    }
  }

  if (book.genre_id) {
    const alike = await getGenreBooks(book.genre_id, book.id, perSection * 2);
    const pick = fresh(alike);
    if (pick.length) {
      sections.push({
        title: book.genres?.name ? `More ${book.genres.name.toLowerCase()}` : "More from this shelf",
        books: pick,
      });
      remember(pick);
    }
  }

  // Nothing in common yet (a lonely title in a new genre, a one-book author):
  // offer the newest arrivals rather than ending the page on nothing.
  if (!sections.length) {
    const newest = await getNewestBooks(book.id, perSection);
    if (newest.length) sections.push({ title: "More from the shelves", books: newest });
  }

  return sections;
}

/** Newest arrivals — the last-resort suggestion so a page is never a dead end. */
export async function getNewestBooks(excludeId: string, limit = 4): Promise<Book[]> {
  return computePublic(
    async (sb) => {
      const { data, error } = await sb
        .from("books")
        .select(BOOK_SELECT_LIST)
        .eq("is_active", true)
        .neq("id", excludeId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Book[];
    },
    [] as Book[],
  );
}

export type AuthorSummary = { author: Author; titles: number; series: string[] };

/** Authors we actually hold books by, busiest first — for the /authors index. */
export async function getAuthorsWithCounts(): Promise<AuthorSummary[]> {
  const [authors, rows] = await Promise.all([
    getAuthors(),
    queryPublic<{ author_id: string | null; series: string | null }[]>(
      (sb) => sb.from("books").select("author_id, series").eq("is_active", true),
      [],
    ),
  ]);

  const titles = new Map<string, number>();
  const seriesByAuthor = new Map<string, Set<string>>();

  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row.author_id) continue;
    titles.set(row.author_id, (titles.get(row.author_id) ?? 0) + 1);
    if (row.series) {
      const set = seriesByAuthor.get(row.author_id) ?? new Set<string>();
      set.add(row.series);
      seriesByAuthor.set(row.author_id, set);
    }
  }

  return authors
    .map((author) => ({
      author,
      titles: titles.get(author.id) ?? 0,
      series: [...(seriesByAuthor.get(author.id) ?? [])].sort(),
    }))
    .filter((entry) => entry.titles > 0)
    .sort((a, b) => b.titles - a.titles || a.author.name.localeCompare(b.author.name));
}

/** How many times each book has been borrowed, keyed by book id. */
export async function getBorrowCountsByBook(): Promise<Record<string, number>> {
  const rows = await queryPublic<{ book_id: string; borrowed: number }[]>(
    (sb) => sb.rpc("book_borrow_counts"),
    [],
  );

  const out: Record<string, number> = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    out[row.book_id] = Number(row.borrowed) || 0;
  }
  return out;
}

/**
 * The book featured in the home-page carousel: the newest active title that
 * actually has a description, so the pull-quote is real text rather than filler.
 */
export async function getFeaturedBook(): Promise<Book | null> {
  return queryPublic<Book | null>(
    (sb) =>
      sb
        .from("books")
        .select(BOOK_SELECT)
        .eq("is_active", true)
        .not("description", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    null,
  );
}

export async function getBookById(id: string): Promise<Book | null> {
  return queryPublic<Book | null>((sb) => sb.from("books").select(BOOK_SELECT).eq("id", id).maybeSingle(), null);
}

export async function getLanguages(): Promise<string[]> {
  const rows = await queryPublic<{ language: string | null }[]>(
    (sb) => sb.from("books").select("language").eq("is_active", true),
    [],
  );
  return Array.from(new Set(rows.map((r) => r.language).filter(Boolean) as string[])).sort();
}

/* -------------------------------------------------------------------------- */
/* Membership state — the single place quota is worked out                     */
/* -------------------------------------------------------------------------- */

export type MembershipState = {
  subscription: Subscription | null;
  plan: Plan | null;
  rentals: Rental[];
  box: Rental[];
  out: Rental[];
  quota: number;
  used: number;
  remaining: number;
  overdue: boolean;
  isSwap: boolean;
};

export async function getMembershipState(userId: string): Promise<MembershipState> {
  const subscription = await getActiveSubscription(userId);
  const rentals = subscription ? await getRentalsForSubscription(subscription.id) : [];
  const quota = subscription?.plans?.books_per_month ?? 0;
  const periodStart = subscription?.current_period_start ?? subscription?.started_at ?? null;
  const out = booksOut(rentals);

  return {
    subscription,
    plan: subscription?.plans ?? null,
    rentals,
    box: boxBooks(rentals),
    out,
    quota,
    used: usedSlots(rentals, periodStart),
    remaining: remainingSlots(rentals, quota, periodStart),
    overdue: hasOverdue(rentals),
    isSwap: out.some(
      (rental) =>
        periodStart &&
        new Date(rental.checked_out_at ?? rental.created_at).getTime() < new Date(periodStart).getTime(),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Customer data                                                               */
/* -------------------------------------------------------------------------- */

export async function getAddresses(userId: string): Promise<Address[]> {
  return query<Address[]>(
    (sb) =>
      sb.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false }),
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

export async function getMyRentals(userId: string): Promise<Rental[]> {
  return query<Rental[]>(
    (sb) =>
      sb.from("rentals").select(RENTAL_SELECT).eq("user_id", userId).order("created_at", { ascending: false }),
    [],
  );
}

export async function getRentalsForSubscription(subscriptionId: string): Promise<Rental[]> {
  return query<Rental[]>(
    (sb) =>
      sb.from("rentals").select(RENTAL_SELECT).eq("subscription_id", subscriptionId).order("created_at"),
    [],
  );
}

export async function getMyShipments(userId: string): Promise<Shipment[]> {
  return query<Shipment[]>(
    (sb) =>
      sb
        .from("shipments")
        .select("*, shipment_items(*, rentals(*, books(id, title, slug, cover_url)))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  return query<Order[]>(
    (sb) =>
      sb.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
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

export async function getMyNotifications(userId: string): Promise<AppNotification[]> {
  return query<AppNotification[]>(
    (sb) => sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
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
    deposits_requested: 0,
    mrr: 0,
    books_out: 0,
    to_ship: 0,
    returns_pending: 0,
    overdue_rentals: 0,
    notifications_queued: 0,
  };
  const stats = await query<DashboardStats | null>((sb) => sb.rpc("admin_dashboard_stats"), null);
  return stats ? { ...fallback, ...stats } : fallback;
}

export async function getRecentOrders(limit = 8): Promise<Order[]> {
  return query<Order[]>(
    (sb) =>
      sb.from("orders").select("*, profiles(full_name, phone)").order("created_at", { ascending: false }).limit(limit),
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
        .select(
          "*, profiles(*), order_items(*), addresses(*), payments(*), shipments(*, shipment_items(*, rentals(*, books(id, title, slug, cover_url))))",
        )
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
        // `payments` has two FKs to profiles (user_id and verified_by), so the
        // embed must name the relationship or PostgREST errors out.
        .select(
          "*, orders(order_number, total, type), profiles!payments_user_id_fkey(full_name, phone)",
        )
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

/** Rentals, optionally filtered. `open` shows everything not yet returned. */
export async function listRentals(options: { status?: string; open?: boolean; overdue?: boolean } = {}): Promise<Rental[]> {
  return query<Rental[]>(
    (sb) => {
      let q = sb
        .from("rentals")
        .select("*, books(id, title, slug, cover_url, authors(name)), profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(300);

      if (options.status) q = q.eq("status", options.status);
      if (options.open) q = q.in("status", ["pending", "out", "returning"]);
      if (options.overdue) {
        q = q.in("status", ["out", "returning"]).lt("due_at", new Date().toISOString());
      }
      return q;
    },
    [],
  );
}

export async function listShipments(status?: string): Promise<Shipment[]> {
  return query<Shipment[]>(
    (sb) => {
      let q = sb
        .from("shipments")
        .select(SHIPMENT_SELECT)
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

export async function getShipment(id: string): Promise<Shipment | null> {
  return query<Shipment | null>(
    (sb) =>
      sb
        .from("shipments")
        .select(
          "*, profiles(*), addresses(*), shipment_items(*, rentals(*, books(id, title, slug, cover_url)))",
        )
        .eq("id", id)
        .maybeSingle(),
    null,
  );
}

export async function listNotifications(status?: string): Promise<AppNotification[]> {
  return query<AppNotification[]>(
    (sb) => {
      let q = sb
        .from("notifications")
        .select("*, profiles(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    },
    [],
  );
}

/**
 * Orders joined with the things they should have produced (membership,
 * shipments, book lines). The diagnostics page reads this to spot orders whose
 * pipeline never completed.
 */
export async function listOrderDiagnostics(): Promise<any[]> {
  return query<any[]>(
    (sb) =>
      sb
        .from("orders")
        .select(
          "id, order_number, status, type, user_id, created_at, deposit_amount, delivery_fee, subscription_id, subscriptions(id, status, current_period_end), shipments(id, status), profiles(full_name, phone), order_items(id, book_id, label)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
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
      let builder = sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) builder = builder.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
      return builder;
    },
    [],
  );
}

export async function getCustomer(id: string): Promise<Profile | null> {
  return query<Profile | null>((sb) => sb.from("profiles").select("*").eq("id", id).maybeSingle(), null);
}

export async function getCustomerOrders(userId: string): Promise<Order[]> {
  return query<Order[]>(
    (sb) =>
      sb.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
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
    (sb) =>
      sb
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

export async function getCustomerRentals(userId: string): Promise<Rental[]> {
  return query<Rental[]>(
    (sb) =>
      sb
        .from("rentals")
        .select("*, books(id, title, slug, cover_url, authors(name))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

export async function getCustomerShipments(userId: string): Promise<Shipment[]> {
  return query<Shipment[]>(
    (sb) =>
      sb
        .from("shipments")
        .select("*, shipment_items(*, rentals(*, books(id, title, slug, cover_url)))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* CMS                                                                         */
/* -------------------------------------------------------------------------- */

export async function getCmsPages(includeDrafts = false): Promise<CmsPage[]> {
  return queryPublic<CmsPage[]>((sb) => {
    let q = sb.from("cms_pages").select("*").order("sort_order");
    if (!includeDrafts) q = q.eq("status", "published");
    return q;
  }, []);
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  return queryPublic<CmsPage | null>(
    (sb) => sb.from("cms_pages").select("*").eq("slug", slug).maybeSingle(),
    null,
  );
}

export async function getCmsPageById(id: string): Promise<CmsPage | null> {
  return query<CmsPage | null>((sb) => sb.from("cms_pages").select("*").eq("id", id).maybeSingle(), null);
}
