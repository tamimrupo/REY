"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { supabaseConfigured } from "@/lib/env";
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

function revalidateAdmin(...paths: string[]) {
  revalidatePath("/admin");
  for (const p of paths) revalidatePath(p);
}

/* -------------------------------------------------------------------------- */
/* Books                                                                       */
/* -------------------------------------------------------------------------- */

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

  // Resolve or create the author
  let authorId = str(formData, "author_id") || null;
  const newAuthor = str(formData, "new_author");
  if (newAuthor && !authorId) {
    const { data } = await supabase
      .from("authors")
      .insert({ name: newAuthor, slug: slugify(newAuthor) || `author-${Date.now()}` })
      .select("id")
      .single();
    authorId = data?.id ?? null;
  }

  // Resolve or create the genre
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

  const payload: Record<string, any> = {
    title,
    slug: str(formData, "slug") || slugify(title) || `book-${Date.now()}`,
    subtitle: str(formData, "subtitle") || null,
    author_id: authorId,
    genre_id: genreId,
    description: str(formData, "description") || null,
    cover_url: str(formData, "cover_url") || null,
    language: str(formData, "language") || "English",
    isbn: str(formData, "isbn") || null,
    publisher: str(formData, "publisher") || null,
    published_year: publishedYear > 0 ? publishedYear : null,
    pages: num(formData, "pages", 0) || null,
    rarity: str(formData, "rarity") === "rare" ? "rare" : "common",
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
    tagline: str(formData, "tagline") || null,
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

  // Replace features wholesale — the textarea is the source of truth.
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
/* Payments                                                                    */
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

  const { data: payment, error: readError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();
  if (readError || !payment) return fail("Payment not found.");

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

  if (payment.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", payment.order_id)
      .single();

    if (order) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);

      // Start the clock on the subscription.
      if (order.subscription_id) {
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        const nextBilling = new Date(end);

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            started_at: start.toISOString(),
            current_period_start: start.toISOString(),
            current_period_end: end.toISOString(),
            next_billing_date: nextBilling.toISOString().slice(0, 10),
          })
          .eq("id", order.subscription_id);

        // Hold the security deposit once per customer.
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

        // Queue the first delivery.
        const courier =
          (order.notes ?? "").toLowerCase().includes("pathao")
            ? "pathao"
            : (order.notes ?? "").toLowerCase().includes("redx")
              ? "redx"
              : (order.notes ?? "").toLowerCase().includes("bdpost")
                ? "bdpost"
                : "steadfast";

        const { data: existingDelivery } = await supabase
          .from("deliveries")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

        if (!existingDelivery) {
          await supabase.from("deliveries").insert({
            order_id: order.id,
            subscription_id: order.subscription_id,
            address_id: order.address_id,
            courier,
            status: "pending",
            fee: order.delivery_fee,
          });
        }
      }
    }
  }

  revalidateAdmin("/admin/payments", "/admin/orders", "/admin/subscriptions", "/admin/deliveries");
  return { ok: true, message: "Payment verified and subscription activated." };
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
/* Orders, subscriptions, deliveries, deposits                                 */
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

export async function setCycleStatusAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("subscription_cycles").update({ status }).eq("id", id);
  revalidateAdmin("/admin/subscriptions");
}

export async function saveDeliveryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing delivery.");

  const status = str(formData, "status") || "pending";
  const patch: Record<string, any> = {
    courier: str(formData, "courier") || "steadfast",
    tracking_code: str(formData, "tracking_code") || null,
    status,
    notes: str(formData, "notes") || null,
  };
  if (status === "dispatched") patch.dispatched_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("deliveries").update(patch).eq("id", id);
  if (error) return fail(error.message);

  revalidateAdmin("/admin/deliveries");
  return { ok: true, message: "Delivery updated." };
}

export async function refundDepositAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireAdmin();

  const id = str(formData, "id");
  if (!id) return fail("Missing deposit.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("deposits")
    .update({
      status: str(formData, "status") || "refunded",
      refunded_at: new Date().toISOString(),
      refund_trx_id: str(formData, "refund_trx_id") || null,
      notes: str(formData, "notes") || null,
    })
    .eq("id", id);
  if (error) return fail(error.message);

  revalidateAdmin("/admin/deposits");
  return { ok: true, message: "Deposit updated." };
}

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
      full_name: str(formData, "full_name") || null,
      phone: str(formData, "phone") || null,
      role: str(formData, "role") || "customer",
      notes: str(formData, "notes") || null,
      is_blocked: bool(formData, "is_blocked"),
    })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidateAdmin("/admin/customers", `/admin/customers/${id}`);
  return { ok: true, message: "Customer updated." };
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
    excerpt: str(formData, "excerpt") || null,
    content: str(formData, "content") || null,
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
    value = {
      enabled: bool(formData, "enabled"),
      instructions: str(formData, "instructions"),
      methods,
    };
  } else if (kind === "delivery") {
    const methods = [0, 1, 2, 3, 4]
      .map((i) => ({
        key: str(formData, `courier_key_${i}`),
        label: str(formData, `courier_label_${i}`),
        fee: num(formData, `courier_fee_${i}`, 0),
        note: str(formData, `courier_note_${i}`),
      }))
      .filter((m) => m.key && m.label);
    value = { methods };
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
