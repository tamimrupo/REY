"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getCronSecret, getRentalSettings, getWhatsappSettings } from "@/lib/data";
import { seriesName, slugify } from "@/lib/format";
import { supabaseConfigured } from "@/lib/env";
import { fetchCandidate, type BookSource } from "@/lib/book-search";
import { bookSlug, csvToRows, fetchOpenLibrary, normalizeIsbn } from "@/lib/import";
import {
  ensureAuthor,
  ensureGenre,
  findExistingBook,
  importCandidate,
  newImportContext,
  syncCopies,
  uniqueSlug,
} from "@/lib/import-server";
import { fillTemplate } from "@/lib/quotas";
import { sendMetaEvent } from "@/lib/meta";
import { emailConfigured, queueNotification, sendEmail } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fail(message: string): ActionState {
  return { ok: false, message };
}

const NOT_READY = "Supabase is not connected yet.";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function num(formData: FormData, key: string, fallback = 0): number {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
function orNull(value: string): string | null {
  return value ? value : null;
}

function revalidateAdmin(...paths: string[]) {
  revalidatePath("/admin");
  for (const p of paths) revalidatePath(p);
}

function rpcMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  const raw = (error as { message?: string }).message ?? String(error);
  return raw.replace(/^[\w\s]*ERROR:\s*/i, "").replace(/^P0001:\s*/i, "").trim();
}

/** Finds a free physical copy and marks it rented. */
async function takeCopy(supabase: any, bookId: string): Promise<string | null> {
  const { data: copy } = await supabase
    .from("book_copies")
    .select("id")
    .eq("book_id", bookId)
    .eq("status", "available")
    .limit(1)
    .maybeSingle();

  if (!copy) return null;
  await supabase.from("book_copies").update({ status: "rented" }).eq("id", copy.id);
  return copy.id as string;
}

async function releaseCopy(supabase: any, copyId: string | null): Promise<void> {
  if (!copyId) return;
  await supabase.from("book_copies").update({ status: "available" }).eq("id", copyId);
}

/* -------------------------------------------------------------------------- */
/* Books                                                                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Authors                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Edits an author directly: name, slug, photo and bio.
 *
 * One row per person, shared by every book they carry — so this is the place to
 * turn a Latin name into Bangla, add a portrait, or write the bio that shows on
 * their page. Doing it here saves opening a book to reach them.
 */
export async function saveAuthorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const supabase = await createClient();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id) return fail("Missing author.");
  if (!name) return fail("An author needs a name.");

  const patch: Record<string, string | null> = {
    name,
    avatar_url: str(formData, "avatar_url") || null,
    bio: str(formData, "bio") || null,
  };

  // A slug is a URL: only change it when a new one is typed, so renaming an
  // author never breaks a link someone already shared.
  const wanted = slugify(str(formData, "slug"));
  if (wanted) patch.slug = wanted;

  const { error } = await supabase.from("authors").update(patch).eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/admin/authors");
  revalidatePath("/authors");
  revalidatePath("/library");
  return { ok: true, message: `Saved ${name}. Every book by them is updated.` };
}

export async function saveBookAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const supabase = await createClient();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return fail("A title is required.");

  let authorId = str(formData, "author_id") || null;
  const newAuthor = str(formData, "new_author");

  if (newAuthor) {
    // The name may already belong to someone — point the book at them instead of
    // creating a second row for the same person.
    const { data: existingAuthor } = await supabase
      .from("authors")
      .select("id")
      .ilike("name", newAuthor)
      .maybeSingle();

    if (existingAuthor?.id) {
      authorId = existingAuthor.id;
    } else if (authorId) {
      // Renaming the author this book already has. The row is shared, so one edit
      // fixes every book they carry — which is how a Latin name becomes a Bangla
      // one without touching 30 records. The slug stays put so author URLs keep
      // working.
      await supabase.from("authors").update({ name: newAuthor }).eq("id", authorId);
    } else {
      const { data } = await supabase
        .from("authors")
        .insert({ name: newAuthor, slug: slugify(newAuthor) || `author-${Date.now()}` })
        .select("id")
        .single();
      authorId = data?.id ?? null;
    }
  }

  // Optional author photo and bio, used by the author card on book pages and the
  // round avatar on the home shelf. Both are only applied when the author is not
  // being reassigned, so switching a book to a different author can never copy the
  // previous author's details onto them.
  const originalAuthorId = str(formData, "original_author_id") || null;
  const authorAvatar = str(formData, "author_avatar_url");
  const authorBio = str(formData, "author_bio");
  const canEditAuthor = !originalAuthorId || authorId === originalAuthorId;

  if (authorId && canEditAuthor && (authorAvatar || authorBio)) {
    const patch: Record<string, string> = {};
    if (authorAvatar) patch.avatar_url = authorAvatar;
    if (authorBio) patch.bio = authorBio;
    await supabase.from("authors").update(patch).eq("id", authorId);
  }

  let genreId = str(formData, "genre_id") || null;
  const newGenre = str(formData, "new_genre");
  if (newGenre && !genreId) {
    const { data } = await supabase
      .from("genres")
      .insert({ name: newGenre, slug: slugify(newGenre) || `genre-${Date.now()}` })
      .select("id")
      .single();
    genreId = data?.id ?? null;
  }

  const publishedYear = num(formData, "published_year", 0);
  const demandRaw = str(formData, "demand");

  const payload: Record<string, any> = {
    title,
    slug: str(formData, "slug") || slugify(title) || `book-${Date.now()}`,
    subtitle: orNull(str(formData, "subtitle")),
    author_id: authorId,
    genre_id: genreId,
    description: orNull(str(formData, "description")),
    cover_url: orNull(str(formData, "cover_url")),
    language: str(formData, "language") || "English",
    isbn: orNull(str(formData, "isbn")),
    publisher: orNull(str(formData, "publisher")),
    published_year: publishedYear > 0 ? publishedYear : null,
    pages: num(formData, "pages", 0) || null,
    rarity: str(formData, "rarity") === "rare" ? "rare" : "common",
    demand: ["high", "medium", "low"].includes(demandRaw) ? demandRaw : "medium",
    replacement_value: num(formData, "replacement_value", 0),
    weight_grams: num(formData, "weight_grams", 0) || null,
    series: seriesName(str(formData, "series")),
    series_order: num(formData, "series_order", 0) || null,
    is_active: bool(formData, "is_active"),
    total_copies: Math.max(1, num(formData, "total_copies", 1)),
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("books").update(payload).eq("id", id)
    : await supabase.from("books").insert(payload);

  if (error) return fail(error.message);

  revalidateAdmin("/admin/books");
  return { ok: true, message: id ? "Book updated." : "Book added." };
}

export async function deleteBookAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);
  revalidateAdmin("/admin/books");
}

export async function toggleBookActiveAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const next = str(formData, "next") === "true";

  const supabase = await createClient();
  await supabase.from("books").update({ is_active: next }).eq("id", id);
  revalidateAdmin("/admin/books");
}

/** Publish every high-demand title in one click (the plugin's "publish high"). */
export async function publishHighDemandAction(): Promise<void> {
  if (!supabaseConfigured) return;
  await requireAdmin();

  const supabase = await createClient();
  await supabase.from("books").update({ is_active: true }).eq("demand", "high");
  revalidateAdmin("/admin/books", "/admin/import");
}

/** Publish or hide a batch of books (used by the catalog checkboxes). */
export async function bulkBookStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();

  const ids = formData.getAll("book_ids").map((value) => String(value)).filter(Boolean);
  const active = str(formData, "active") === "true";
  if (!ids.length) return;

  const supabase = await createClient();
  await supabase.from("books").update({ is_active: active }).in("id", ids);
  revalidateAdmin("/admin/books");
}

/* -------------------------------------------------------------------------- */
/* Plans                                                                       */
/* -------------------------------------------------------------------------- */

export async function savePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const supabase = await createClient();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return fail("A plan name is required.");

  const payload = {
    name,
    slug: str(formData, "slug") || slugify(name),
    tagline: orNull(str(formData, "tagline")),
    price_monthly: num(formData, "price_monthly"),
    books_per_month: Math.max(1, num(formData, "books_per_month", 2)),
    security_deposit: num(formData, "security_deposit", 500),
    is_popular: bool(formData, "is_popular"),
    is_active: bool(formData, "is_active"),
    sort_order: num(formData, "sort_order", 0),
  };

  const { data, error } = id
    ? await supabase.from("plans").update(payload).eq("id", id).select("id").single()
    : await supabase.from("plans").insert(payload).select("id").single();

  if (error) return fail(error.message);

  const features = str(formData, "features")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await supabase.from("plan_features").delete().eq("plan_id", data.id);
  if (features.length) {
    await supabase
      .from("plan_features")
      .insert(features.map((feature, i) => ({ plan_id: data.id, feature, sort_order: i + 1 })));
  }

  revalidateAdmin("/admin/plans", "/plans");
  return { ok: true, message: id ? "Plan updated." : "Plan created." };
}

export async function deletePlanAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("plans").delete().eq("id", id);
  revalidateAdmin("/admin/plans", "/plans");
}

/* -------------------------------------------------------------------------- */
/* Payments — verifying activates the membership and its books                 */
/* -------------------------------------------------------------------------- */

export async function verifyPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const session = await requireAdmin();

  const id = str(formData, "payment_id");
  if (!id) return fail("Missing payment.");

  const supabase = await createClient();
  const { data: payment } = await supabase.from("payments").select("*").eq("id", id).single();
  if (!payment) return fail("Payment not found.");

  const { error } = await supabase
    .from("payments")
    .update({
      status: "verified",
      verified_by: session.userId,
      verified_at: new Date().toISOString(),
      reject_reason: null,
    })
    .eq("id", id);
  if (error) return fail(error.message);

  if (!payment.order_id) {
    revalidateAdmin("/admin/payments");
    return { ok: true, message: "Payment verified." };
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", payment.order_id).single();
  if (!order) {
    revalidateAdmin("/admin/payments");
    return { ok: true, message: "Payment verified. The order is missing." };
  }

  await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);

  // The admin has confirmed the money arrived — this is the shop's real
  // Purchase, sent server-side so blocked pixels and iOS still count. The phone
  // is the identifier Bangladeshi customers actually use; the email (when the
  // service-role key is configured) raises the match rate further.
  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", order.user_id)
    .maybeSingle();
  const adminClient = createAdminClient();
  let customerEmail: string | null = null;
  if (adminClient) {
    const { data: account } = await adminClient.auth.admin.getUserById(order.user_id);
    customerEmail = account?.user?.email ?? null;
  }
  after(() =>
    sendMetaEvent({
      name: "Purchase",
      eventId: `purchase-${payment.id}`,
      email: customerEmail,
      phone: customer?.phone ?? null,
      value: Number(payment.amount ?? order.total) || 0,
      currency: "BDT",
      contentName: order.order_number,
    }),
  );

  if (order.subscription_id) {
    const rentalSettings = await getRentalSettings();
    const days = Math.max(1, Number(rentalSettings.duration_days) || 30);

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("id", order.subscription_id)
      .single();

    if (subscription) {
      const now = new Date();
      // A renewal extends the existing month instead of restarting it.
      const isRenewal = order.type === "renewal" && subscription.current_period_end;
      const start = isRenewal
        ? new Date(Math.max(now.getTime(), new Date(subscription.current_period_end).getTime()))
        : now;
      const end = new Date(start.getTime() + days * 86_400_000);

      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          started_at: subscription.started_at ?? now.toISOString(),
          current_period_start: isRenewal ? subscription.current_period_start : now.toISOString(),
          current_period_end: end.toISOString(),
          next_billing_date: end.toISOString().slice(0, 10),
        })
        .eq("id", subscription.id);

      // Books already out stay valid until the new period ends.
      if (isRenewal) {
        await supabase
          .from("rentals")
          .update({ due_at: end.toISOString() })
          .eq("subscription_id", subscription.id)
          .in("status", ["pending", "out", "returning"]);
      } else {
        await supabase
          .from("rentals")
          .update({ due_at: end.toISOString() })
          .eq("subscription_id", subscription.id)
          .eq("status", "pending");
      }

      // Hold the security deposit exactly once per customer.
      if (Number(order.deposit_amount) > 0) {
        const { data: existing } = await supabase
          .from("deposits")
          .select("id")
          .eq("user_id", order.user_id)
          .eq("status", "held")
          .maybeSingle();

        if (!existing) {
          await supabase.from("deposits").insert({
            user_id: order.user_id,
            subscription_id: order.subscription_id,
            amount: order.deposit_amount,
            status: "held",
            notes: `Collected with order ${order.order_number}`,
          });
        }
      }
    }
  }

  revalidateAdmin(
    "/admin/payments",
    "/admin/orders",
    "/admin/subscriptions",
    "/admin/shipments",
    "/admin/rentals",
    "/account",
  );
  return { ok: true, message: "Payment verified. Membership activated." };
}

export async function rejectPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "payment_id");
  if (!id) return fail("Missing payment.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "rejected", reject_reason: str(formData, "reason") || "Could not verify" })
    .eq("id", id);
  if (error) return fail(error.message);

  revalidateAdmin("/admin/payments");
  return { ok: true, message: "Payment rejected." };
}

/* -------------------------------------------------------------------------- */
/* Orders + subscriptions                                                      */
/* -------------------------------------------------------------------------- */

export async function setOrderStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidateAdmin("/admin/orders");
}

export async function setSubscriptionStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return;

  const supabase = await createClient();
  const patch: Record<string, any> = { status };
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
  await supabase.from("subscriptions").update(patch).eq("id", id);
  revalidateAdmin("/admin/subscriptions");
}

/* -------------------------------------------------------------------------- */
/* Shipments                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveShipmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing shipment.");

  const status = str(formData, "status") || "pending";
  const supabase = await createClient();

  const { data: shipment } = await supabase.from("shipments").select("*").eq("id", id).single();
  if (!shipment) return fail("Shipment not found.");

  const patch: Record<string, any> = {
    courier: str(formData, "courier") || shipment.courier,
    tracking: orNull(str(formData, "tracking")),
    bdpost_receipt: orNull(str(formData, "bdpost_receipt")),
    notes: orNull(str(formData, "notes")),
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "shipped") patch.dispatched_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();

  const { error } = await supabase.from("shipments").update(patch).eq("id", id);
  if (error) return fail(error.message);

  const { data: items } = await supabase
    .from("shipment_items")
    .select("*, rentals(*, books(id, title, cover_url))")
    .eq("shipment_id", id);

  const rows = (items ?? []) as any[];
  let message = "Shipment updated.";

  if (status === "packed" || status === "shipped" || status === "delivered") {
    // Books leave the building.
    for (const item of rows) {
      if (item.direction !== "out") continue;
      const rental = item.rentals;
      if (!rental || rental.status === "out") continue;
      const copyId = rental.copy_id ?? (await takeCopy(supabase, rental.book_id));
      await supabase
        .from("rentals")
        .update({
          status: "out",
          checked_out_at: rental.checked_out_at ?? new Date().toISOString(),
          copy_id: copyId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rental.id);
    }
    message = "Shipment marked out — books are now with the customer.";
  }

  if (status === "completed") {
    for (const item of rows) {
      const rental = item.rentals;
      if (!rental) continue;
      if (item.direction === "in") {
        await supabase
          .from("rentals")
          .update({ status: "returned", returned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", rental.id);
        await releaseCopy(supabase, rental.copy_id);
      } else if (rental.status !== "out") {
        const copyId = rental.copy_id ?? (await takeCopy(supabase, rental.book_id));
        await supabase
          .from("rentals")
          .update({ status: "out", checked_out_at: new Date().toISOString(), copy_id: copyId })
          .eq("id", rental.id);
      }
    }
    message = "Trip completed. Returned books are back in stock.";
  }

  if (status === "cancelled") {
    for (const item of rows) {
      const rental = item.rentals;
      if (!rental) continue;
      if (item.direction === "in" && rental.status === "returning") {
        await supabase.from("rentals").update({ status: "out" }).eq("id", rental.id);
      } else if (item.direction === "out" && rental.status === "pending") {
        await supabase.from("shipment_items").delete().eq("id", item.id);
      }
    }
    message = "Trip cancelled.";
  }

  // Tell the customer their books are on the way.
  if (status === "shipped" || status === "delivered") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", shipment.user_id)
      .single();

    const titles = rows
      .filter((item) => item.direction === "out")
      .map((item) => item.rentals?.books?.title ?? "Book")
      .join(", ");

    const whatsapp = await getWhatsappSettings();
    const body = fillTemplate(whatsapp.order_text, {
      name: profile?.full_name ?? "there",
      books: titles || "your books",
      order: shipment.order_id ?? shipment.id,
      tracking: patch.tracking ?? "",
    });

    await queueNotification({
      userId: shipment.user_id,
      kind: "dispatch",
      subject: "Your REY BD books are on the way",
      body,
      phone: profile?.phone ?? null,
      meta: { shipment_id: shipment.id },
    });
  }

  revalidateAdmin("/admin/shipments", "/admin/rentals", "/admin/orders");
  return { ok: true, message };
}

export async function setShipmentStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("shipments").update({ status }).eq("id", id);
  revalidateAdmin("/admin/shipments");
}

/* -------------------------------------------------------------------------- */
/* Rentals                                                                     */
/* -------------------------------------------------------------------------- */

export async function markRentalReturnedAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const lost = str(formData, "lost") === "true";

  const supabase = await createClient();
  const { data: rental } = await supabase.from("rentals").select("*").eq("id", id).single();
  if (!rental) return;

  if (lost) {
    await supabase
      .from("rentals")
      .update({ status: "lost", lost_at: new Date().toISOString() })
      .eq("id", id);
    if (rental.copy_id) {
      await supabase.from("book_copies").update({ status: "lost" }).eq("id", rental.copy_id);
    }
  } else {
    await supabase
      .from("rentals")
      .update({ status: "returned", returned_at: new Date().toISOString() })
      .eq("id", id);
    await releaseCopy(supabase, rental.copy_id);
  }

  revalidateAdmin("/admin/rentals");
}

export async function markAllReturnedAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const userId = str(formData, "user_id");
  if (!userId) return;

  const supabase = await createClient();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("id, copy_id")
    .eq("user_id", userId)
    .in("status", ["pending", "out", "returning"]);

  for (const rental of (rentals ?? []) as any[]) {
    await supabase
      .from("rentals")
      .update({ status: "returned", returned_at: new Date().toISOString() })
      .eq("id", rental.id);
    await releaseCopy(supabase, rental.copy_id);
  }

  revalidateAdmin("/admin/rentals", "/admin/customers");
}

/* -------------------------------------------------------------------------- */
/* Deposits                                                                    */
/* -------------------------------------------------------------------------- */

export async function refundDepositAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing deposit.");

  const status = str(formData, "status") || "refunded";
  const supabase = await createClient();

  const { data: deposit } = await supabase.from("deposits").select("*").eq("id", id).single();
  const { error } = await supabase
    .from("deposits")
    .update({
      status,
      refunded_at: status === "refunded" ? new Date().toISOString() : null,
      refund_trx_id: orNull(str(formData, "refund_trx_id")),
      notes: orNull(str(formData, "notes")) ?? deposit?.notes ?? null,
    })
    .eq("id", id);
  if (error) return fail(error.message);

  if (status === "refunded" && deposit?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", deposit.user_id)
      .single();

    await queueNotification({
      userId: deposit.user_id,
      kind: "deposit",
      subject: "Your security deposit has been refunded",
      body: `Hello ${profile?.full_name ?? "there"}, we have sent your ৳${deposit.amount} security deposit back${
        str(formData, "refund_trx_id") ? ` (TrxID ${str(formData, "refund_trx_id")})` : ""
      }. Thank you for reading with REY BD.`,
      phone: profile?.phone ?? null,
    });
  }

  revalidateAdmin("/admin/deposits");
  return { ok: true, message: "Deposit updated." };
}

/* -------------------------------------------------------------------------- */
/* Rare requests                                                               */
/* -------------------------------------------------------------------------- */

export async function setRequestStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("rare_requests").update({ status }).eq("id", id);
  revalidateAdmin("/admin/requests");
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing customer.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: orNull(str(formData, "full_name")),
      phone: orNull(str(formData, "phone")),
      role: str(formData, "role") || "customer",
      notes: orNull(str(formData, "notes")),
      is_blocked: bool(formData, "is_blocked"),
      courier_preference: str(formData, "courier_preference") || "steadfast",
    })
    .eq("id", id);
  if (error) return fail(error.message);

  revalidateAdmin("/admin/customers", `/admin/customers/${id}`);
  return { ok: true, message: "Customer updated." };
}

/* -------------------------------------------------------------------------- */
/* Notifications (outbox)                                                      */
/* -------------------------------------------------------------------------- */

export async function sendNotificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing notification.");

  const supabase = await createClient();
  const { data: notification } = await supabase.from("notifications").select("*").eq("id", id).single();
  if (!notification) return fail("Notification not found.");

  if (!notification.email) {
    await supabase
      .from("notifications")
      .update({ status: "manual", error: "No email on file — send it over WhatsApp." })
      .eq("id", id);
    revalidateAdmin("/admin/notifications");
    return { ok: true, message: "No email on file. Use the WhatsApp button." };
  }

  if (!emailConfigured) {
    await supabase
      .from("notifications")
      .update({ status: "manual", error: "No email provider configured" })
      .eq("id", id);
    revalidateAdmin("/admin/notifications");
    return fail("Email is not set up. Add RESEND_API_KEY, or send it over WhatsApp.");
  }

  const result = await sendEmail(
    notification.email,
    notification.subject ?? "REY BD",
    notification.body,
  );

  await supabase
    .from("notifications")
    .update({
      status: result.ok ? "sent" : "failed",
      sent_at: result.ok ? new Date().toISOString() : null,
      error: result.error ?? null,
    })
    .eq("id", id);

  revalidateAdmin("/admin/notifications");
  return result.ok
    ? { ok: true, message: "Email sent." }
    : fail(`Could not send: ${result.error ?? "unknown error"}`);
}

export async function markNotificationDoneAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") || "sent";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ status, sent_at: new Date().toISOString() })
    .eq("id", id);
  revalidateAdmin("/admin/notifications");
}

/** Compose a one-off message to a customer from their CRM page. */
export async function messageCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const userId = str(formData, "user_id");
  const body = str(formData, "body");
  if (!userId || !body) return fail("Write a message first.");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .single();

  await queueNotification({
    userId,
    kind: "custom",
    subject: orNull(str(formData, "subject")),
    body,
    phone: profile?.phone ?? null,
  });

  revalidateAdmin("/admin/notifications", `/admin/customers/${userId}`);
  return { ok: true, message: "Added to the outbox. Send it from Notifications." };
}

/* -------------------------------------------------------------------------- */
/* Maintenance + diagnostics                                                   */
/* -------------------------------------------------------------------------- */

export async function runMaintenanceAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _prev;
  void _formData;
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const secret = await getCronSecret();
  if (!secret) return fail("No maintenance secret found. Re-run the SQL migration.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("run_maintenance", { p_secret: secret });
  if (error) return fail(rpcMessage(error));

  const result = data as { expired?: number; reminded?: number; overdue_notices?: number } | null;
  revalidateAdmin("/admin/subscriptions", "/admin/notifications", "/admin");
  return {
    ok: true,
    message: `Ran: expired ${result?.expired ?? 0} plan(s), queued ${result?.reminded ?? 0} renewal reminder(s) and ${
      result?.overdue_notices ?? 0
    } overdue notice(s).`,
  };
}

/**
 * Re-runs the whole order pipeline for one order, skipping whatever already
 * exists — the "fix a stuck order" button from the plugin's diagnostics page.
 */
export async function repairOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const orderId = str(formData, "order_id");
  if (!orderId) return fail("Missing order.");

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();
  if (!order) return fail("Order not found.");

  const notes: string[] = [];

  // 1. Membership
  if (order.subscription_id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", order.subscription_id)
      .single();

    if (subscription && subscription.status === "pending" && order.status !== "pending_payment") {
      const { data: settings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "rental")
        .maybeSingle();
      const days = Number((settings?.value as any)?.duration_days ?? 30) || 30;
      const now = new Date();
      const end = new Date(now.getTime() + days * 86_400_000);

      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          started_at: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          next_billing_date: end.toISOString().slice(0, 10),
        })
        .eq("id", subscription.id);

      await supabase
        .from("rentals")
        .update({ due_at: end.toISOString() })
        .eq("subscription_id", subscription.id)
        .eq("status", "pending");

      notes.push("membership activated");
    }
  }

  // 2. Rentals for any book lines that never became rentals
  const bookLines = ((order.order_items ?? []) as any[]).filter((item) => item.book_id);
  if (bookLines.length) {
    const { data: existing } = await supabase.from("rentals").select("book_id").eq("order_id", order.id);
    const have = new Set(((existing ?? []) as any[]).map((row) => row.book_id));
    const missing = bookLines.filter((line) => !have.has(line.book_id));
    if (missing.length) {
      const { data: subscription } = order.subscription_id
        ? await supabase.from("subscriptions").select("current_period_end").eq("id", order.subscription_id).maybeSingle()
        : { data: null };

      await supabase.from("rentals").insert(
        missing.map((line) => ({
          user_id: order.user_id,
          subscription_id: order.subscription_id,
          book_id: line.book_id as string,
          order_id: order.id,
          status: "pending",
          due_at:
            (subscription?.current_period_end as string | undefined) ??
            new Date(Date.now() + 30 * 86_400_000).toISOString(),
        })),
      );
      notes.push(`created ${missing.length} rental(s)`);
    }
  }

  // 3. A shipment for anything that has none
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!shipment) {
    const { data: rentals } = await supabase.from("rentals").select("id").eq("order_id", order.id);
    if (rentals?.length) {
      const { data: created } = await supabase
        .from("shipments")
        .insert({
          user_id: order.user_id,
          order_id: order.id,
          subscription_id: order.subscription_id,
          address_id: order.address_id,
          type: "outbound",
          courier: order.courier ?? "steadfast",
          status: "pending",
          customer_charge: order.delivery_fee,
          merchant_charge: 0,
        })
        .select("id")
        .single();

      if (created) {
        await supabase.from("shipment_items").insert(
          (rentals as any[]).map((rental) => ({
            shipment_id: created.id,
            rental_id: rental.id,
            direction: "out",
          })),
        );
        notes.push("queued a shipment");
      }
    }
  }

  // 4. Deposit
  if (Number(order.deposit_amount) > 0) {
    const { data: held } = await supabase
      .from("deposits")
      .select("id")
      .eq("user_id", order.user_id)
      .eq("status", "held")
      .maybeSingle();

    if (!held) {
      await supabase.from("deposits").insert({
        user_id: order.user_id,
        subscription_id: order.subscription_id,
        amount: order.deposit_amount,
        status: "held",
        notes: `Repaired from order ${order.order_number}`,
      });
      notes.push("recorded the deposit");
    }
  }

  revalidateAdmin(
    "/admin/diagnostics",
    "/admin/subscriptions",
    "/admin/rentals",
    "/admin/shipments",
    "/admin/deposits",
  );
  return {
    ok: true,
    message: notes.length ? `Order repaired — ${notes.join(", ")}.` : "Nothing to repair on this order.",
  };
}

/* -------------------------------------------------------------------------- */
/* Bulk book import                                                            */
/* -------------------------------------------------------------------------- */

export async function importBooksAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const source = str(formData, "source") || "csv";
  let rows: ReturnType<typeof csvToRows>["rows"] = [];
  let note = "";

  if (source === "openlibrary") {
    const query = str(formData, "query");
    const preset = str(formData, "preset");
    const limit = num(formData, "limit", 24);
    if (!query && !preset) return fail("Pick a preset or type a search.");

    const lookup = query || preset;
    const result = await fetchOpenLibrary(lookup, limit, num(formData, "offset", 0));
    if (result.error) return fail(result.error);
    rows = result.rows;
    note = `Open Library · ${lookup}`;
  } else {
    const csv = str(formData, "csv");
    if (!csv) return fail("Paste some CSV, or switch to Open Library.");
    const parsed = csvToRows(csv);
    if (parsed.error) return fail(parsed.error);
    rows = parsed.rows;
    note = "CSV upload";
  }

  if (!rows.length) return fail("Nothing to import — check the headers and try again.");
  if (rows.length > 200) rows = rows.slice(0, 200);

  const supabase = await createClient();
  const publishNow = bool(formData, "publish");

  const ctx = newImportContext(supabase);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const isbn = normalizeIsbn(row.isbn);

    // De-duplicate on ISBN first, then on title — same rule as the search screen.
    const existing = await findExistingBook(ctx, isbn, row.title);
    const copies = Math.max(1, row.stock ?? 1);

    const payload: Record<string, unknown> = {
      title: row.title,
      author_id: await ensureAuthor(ctx, row.author),
      genre_id: await ensureGenre(ctx, row.genre),
      description: row.description ?? null,
      cover_url: row.image_url ?? null,
      publisher: row.publisher ?? null,
      published_year: row.year ?? null,
      language: row.language ?? "English",
      pages: row.pages ?? null,
      rarity: row.rarity ?? "common",
      demand: row.demand ?? "medium",
      replacement_value: row.replacement_value ?? row.price ?? 0,
      total_copies: copies,
      series: seriesName(row.series),
      series_order: row.series_order ?? null,
      is_active: publishNow || (row.status ?? "publish") === "publish",
    };
    if (isbn) payload.isbn = isbn;

    if (existing) {
      const { error } = await supabase.from("books").update(payload).eq("id", existing.id);
      if (error) {
        skipped += 1;
        continue;
      }
      updated += 1;
      await syncCopies(ctx, existing.id, existing.slug, copies);
      continue;
    }

    const slug = await uniqueSlug(ctx, bookSlug(row.title));
    const { data, error } = await supabase
      .from("books")
      .insert({ ...payload, slug })
      .select("id")
      .single();
    if (error || !data?.id) {
      skipped += 1;
      continue;
    }
    created += 1;
    await syncCopies(ctx, data.id as string, slug, copies);
  }

  revalidateAdmin("/admin/books", "/admin/import");
  return {
    ok: true,
    message: `${note}: ${created} added, ${updated} updated${
      skipped ? `, ${skipped} skipped` : ""
    }. ${publishNow ? "All imported titles are live." : "Imported titles follow their CSV status."}`,
  };
}

/** Counts rows that would import, so the admin can preview before committing. */
export async function previewImportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const source = str(formData, "source") || "csv";

  if (source === "openlibrary") {
    const lookup = str(formData, "query") || str(formData, "preset");
    if (!lookup) return fail("Pick a preset or type a search.");
    const result = await fetchOpenLibrary(lookup, num(formData, "limit", 12), num(formData, "offset", 0));
    if (result.error) return fail(result.error);
    const preview = result.rows
      .slice(0, 6)
      .map((row) => `• ${row.title}${row.author ? ` — ${row.author}` : ""}`)
      .join("\n");
    return { ok: true, message: `Found ${result.rows.length} title(s):\n${preview}` };
  }

  const parsed = csvToRows(str(formData, "csv"));
  if (parsed.error) return fail(parsed.error);
  const preview = parsed.rows
    .slice(0, 6)
    .map((row) => `• ${row.title}${row.author ? ` — ${row.author}` : ""}`)
    .join("\n");
  return {
    ok: true,
    message: `Parsed ${parsed.rows.length} row(s)${
      parsed.skipped ? `, skipped ${parsed.skipped} without a title` : ""
    }:\n${preview}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Search & import                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Imports the titles picked on the search screen.
 *
 * The form only carries `{ source, id }` pairs — every title, author, cover and
 * description is re-read from the metadata source here, so a tampered form can
 * never write arbitrary content into the catalogue.
 */
export async function importCandidatesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  let picks: { source: BookSource; id: string }[] = [];
  try {
    const parsed: unknown = JSON.parse(str(formData, "picks") || "[]");
    if (Array.isArray(parsed)) {
      picks = parsed
        .map((entry) => {
          const row = entry as { source?: unknown; id?: unknown };
          const raw = row?.source;
          const source: BookSource =
            raw === "google" || raw === "archive" ? raw : "openlibrary";
          return {
            source,
            id: String(row?.id ?? "").trim(),
          };
        })
        .filter((entry) => entry.id.length > 0 && entry.id.length < 200)
        .slice(0, 25);
    }
  } catch {
    return fail("Could not read the selection. Search again and retry.");
  }
  if (!picks.length) return fail("Pick at least one title to import.");

  const publish = bool(formData, "publish");
  const supabase = await createClient();
  const ctx = newImportContext(supabase);

  const imported: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const pick of picks) {
    const candidate = await fetchCandidate(pick.source, pick.id);
    if (!candidate) {
      skipped += 1;
      continue;
    }

    const outcome = await importCandidate(ctx, candidate, { publish, rehostCover: true });
    if (outcome === "created") created += 1;
    else if (outcome === "updated") updated += 1;
    else skipped += 1;

    if (outcome !== "skipped") imported.push(candidate.title);
  }

  revalidateAdmin("/admin/books", "/admin/import");
  revalidatePath("/library");
  revalidatePath("/");

  if (!imported.length) {
    return fail("Nothing was imported — the source stopped answering. Try again in a moment.");
  }

  const parts: string[] = [];
  if (created) parts.push(`${created} added`);
  if (updated) parts.push(`${updated} refreshed`);
  if (skipped) parts.push(`${skipped} skipped`);

  const list = imported.slice(0, 5).join(", ");
  const more = imported.length > 5 ? ` and ${imported.length - 5} more` : "";

  return {
    ok: true,
    message: `Import finished — ${parts.join(", ")}. ${list}${more}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* CMS pages                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveCmsPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const supabase = await createClient();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return fail("A page title is required.");

  const payload = {
    title,
    slug: str(formData, "slug") || slugify(title),
    excerpt: orNull(str(formData, "excerpt")),
    content: orNull(str(formData, "content")),
    status: str(formData, "status") === "published" ? "published" : "draft",
    sort_order: num(formData, "sort_order", 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("cms_pages").update(payload).eq("id", id)
    : await supabase.from("cms_pages").insert(payload);
  if (error) return fail(error.message);

  revalidateAdmin("/admin/pages");
  return { ok: true, message: id ? "Page updated." : "Page created." };
}

export async function deleteCmsPageAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("cms_pages").delete().eq("id", id);
  revalidateAdmin("/admin/pages");
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveSimpleSettingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const key = str(formData, "key");
  const kind = str(formData, "kind");
  if (!key) return fail("Missing settings key.");

  let value: Record<string, unknown> = {};

  if (kind === "site") {
    value = {
      name: str(formData, "name"),
      tagline: str(formData, "tagline"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      address: str(formData, "address"),
      facebook: str(formData, "facebook"),
      instagram: str(formData, "instagram"),
    };
  } else if (kind === "announcement") {
    value = { enabled: bool(formData, "enabled"), text: str(formData, "text") };
  } else if (kind === "payments") {
    const methods = [0, 1, 2, 3]
      .map((i) => ({
        key: str(formData, `method_key_${i}`),
        label: str(formData, `method_label_${i}`),
        number: str(formData, `method_number_${i}`),
        type: str(formData, `method_type_${i}`) || "Personal",
      }))
      .filter((m) => m.key && m.label && m.number);
    value = { enabled: bool(formData, "enabled"), instructions: str(formData, "instructions"), methods };
  } else if (kind === "couriers") {
    const methods = [0, 1, 2, 3, 4]
      .map((i) => ({
        key: str(formData, `courier_key_${i}`),
        label: str(formData, `courier_label_${i}`),
        charge: num(formData, `courier_charge_${i}`, 0),
        percent: Math.min(100, Math.max(0, num(formData, `courier_percent_${i}`, 100))),
        return_charge: num(formData, `courier_return_${i}`, num(formData, `courier_charge_${i}`, 0)),
        note: str(formData, `courier_note_${i}`),
      }))
      .filter((m) => m.key && m.label);
    value = {
      methods,
      bdpost: {
        label: str(formData, "bdpost_label") || "BD Post",
        charge: num(formData, "bdpost_charge", 0),
        max_kg: num(formData, "bdpost_max_kg", 5),
        rules: str(formData, "bdpost_rules"),
      },
    };
  } else if (kind === "rental") {
    value = {
      duration_days: Math.max(1, num(formData, "duration_days", 30)),
      block_overdue: bool(formData, "block_overdue"),
      renew_notice_days: Math.min(30, Math.max(1, num(formData, "renew_notice_days", 3))),
      max_parallel_rentals: Math.max(0, num(formData, "max_parallel_rentals", 0)),
    };
  } else if (kind === "whatsapp") {
    value = {
      country_code: str(formData, "country_code").replace(/\D/g, "") || "880",
      renew_text: str(formData, "renew_text"),
      order_text: str(formData, "order_text"),
    };
  } else if (kind === "warehouse") {
    value = {
      name: str(formData, "name"),
      phone: str(formData, "phone"),
      address: str(formData, "address"),
    };
  } else if (kind === "deposit") {
    value = {
      amount: num(formData, "amount", 500),
      refundable: true,
      note: str(formData, "note"),
    };
  } else {
    return fail("Unknown settings kind.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return fail(error.message);

  revalidateAdmin("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const key = str(formData, "key");
  const raw = str(formData, "value");
  if (!key) return fail("Missing settings key.");

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return fail("That settings payload is not valid JSON.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return fail(error.message);

  revalidateAdmin("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
