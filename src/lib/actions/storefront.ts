"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getDeliverySettings, getPaymentSettings, getPlanBySlug } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

function fail(message: string): ActionState {
  return { ok: false, message };
}

const NOT_READY =
  "Supabase is not connected yet. Add your project keys to .env.local first.";

/* -------------------------------------------------------------------------- */
/* Address book                                                                */
/* -------------------------------------------------------------------------- */

function readAddress(formData: FormData) {
  return {
    label: String(formData.get("label") ?? "Home").trim() || "Home",
    recipient: String(formData.get("recipient") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    division: String(formData.get("division") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    area: String(formData.get("area") ?? "").trim() || null,
    street: String(formData.get("street") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim() || null,
    is_default: formData.get("is_default") === "on",
  };
}

export async function saveAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const session = await requireUser("/account/addresses");
  const supabase = await createClient();
  const payload = readAddress(formData);

  if (!payload.recipient || !payload.phone || !payload.street) {
    return fail("Recipient, phone and street address are required.");
  }

  const id = String(formData.get("id") ?? "").trim();

  if (payload.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", session.userId);
  }

  const { error } = id
    ? await supabase.from("addresses").update(payload).eq("id", id).eq("user_id", session.userId)
    : await supabase.from("addresses").insert({ ...payload, user_id: session.userId });

  if (error) return fail(error.message);

  revalidatePath("/account/addresses");
  revalidatePath("/account");
  return { ok: true, message: id ? "Address updated." : "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  if (!supabaseConfigured) return;
  const session = await requireUser("/account/addresses");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id).eq("user_id", session.userId);
  revalidatePath("/account/addresses");
}

/* -------------------------------------------------------------------------- */
/* Checkout: plan + first box                                                  */
/* -------------------------------------------------------------------------- */

export async function startSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const planSlug = String(formData.get("plan") ?? "");
  const session = await requireUser(`/subscribe/${planSlug}`);

  const plan = await getPlanBySlug(planSlug);
  if (!plan) return fail("That plan is no longer available.");

  const bookIds = formData
    .getAll("books")
    .map((v) => String(v))
    .filter(Boolean);

  if (bookIds.length === 0) return fail("Pick at least one book for your first box.");

  const supabase = await createClient();

  // Reuse an address if one is selected, otherwise create a fresh one.
  const addressIdRaw = String(formData.get("address_id") ?? "").trim();
  let addressId: string | null = addressIdRaw || null;

  if (!addressId) {
    const payload = readAddress(formData);
    if (!payload.recipient || !payload.phone || !payload.street) {
      return fail("Add a delivery address before continuing.");
    }
    if (payload.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.userId);
    }
    const { data: address, error } = await supabase
      .from("addresses")
      .insert({ ...payload, user_id: session.userId, is_default: true })
      .select("id")
      .single();
    if (error) return fail(`Could not save address: ${error.message}`);
    addressId = address.id;
  }

  const courier = String(formData.get("courier") ?? "steadfast");
  const delivery = await getDeliverySettings();
  const deliveryFee = delivery.methods.find((m) => m.key === courier)?.fee ?? 40;

  // Security deposit is charged once and stays held for the whole membership.
  const { data: existingDeposit } = await supabase
    .from("deposits")
    .select("id")
    .eq("user_id", session.userId)
    .eq("status", "held")
    .maybeSingle();
  const depositAmount = existingDeposit ? 0 : plan.security_deposit;

  const subtotal = Number(plan.price_monthly);
  const total = subtotal + depositAmount + deliveryFee;

  // 1. subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: session.userId,
      plan_id: plan.id,
      status: "pending",
    })
    .select("id")
    .single();
  if (subError) return fail(subError.message);

  // 2. first cycle
  const { data: cycle, error: cycleError } = await supabase
    .from("subscription_cycles")
    .insert({
      subscription_id: subscription.id,
      cycle_number: 1,
      status: "selecting",
      notes: `First box · ${plan.books_per_month} books`,
    })
    .select("id")
    .single();
  if (cycleError) return fail(cycleError.message);

  // 3. order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: session.userId,
      subscription_id: subscription.id,
      type: "subscription_signup",
      status: "pending_payment",
      subtotal,
      delivery_fee: deliveryFee,
      deposit_amount: depositAmount,
      total,
      address_id: addressId,
      notes: `Courier: ${courier}`,
    })
    .select("id, order_number")
    .single();
  if (orderError) return fail(orderError.message);

  // 4. order lines
  await supabase.from("order_items").insert(
    bookIds.map((bookId) => ({
      order_id: order.id,
      book_id: bookId,
      label: `Rental — ${plan.name}`,
      quantity: 1,
      unit_price: 0,
    })),
  );
  await supabase.from("order_items").insert([
    { order_id: order.id, label: `Plan — ${plan.name} (month 1)`, quantity: 1, unit_price: subtotal },
    ...(depositAmount > 0
      ? [{ order_id: order.id, label: "Refundable security deposit", quantity: 1, unit_price: depositAmount }]
      : []),
    ...(deliveryFee > 0
      ? [{ order_id: order.id, label: `Delivery — ${courier}`, quantity: 1, unit_price: deliveryFee }]
      : []),
  ]);

  // 5. the picks for cycle 1
  await supabase.from("cycle_picks").insert(
    bookIds.map((bookId) => ({ cycle_id: cycle.id, book_id: bookId, status: "selected" })),
  );

  redirect(`/checkout/${order.id}`);
}

/* -------------------------------------------------------------------------- */
/* Existing cycle picks                                                        */
/* -------------------------------------------------------------------------- */

export async function savePicksAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  await requireUser("/account");
  const cycleId = String(formData.get("cycle_id") ?? "");
  const limit = Number(formData.get("limit") ?? 0);
  const bookIds = formData.getAll("books").map((v) => String(v)).filter(Boolean);

  if (!cycleId) return fail("Missing cycle.");
  if (bookIds.length === 0) return fail("Choose at least one book.");
  if (limit && bookIds.length > limit) return fail(`Your plan allows ${limit} books.`);

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("cycle_picks")
    .delete()
    .eq("cycle_id", cycleId);
  if (deleteError) return fail(deleteError.message);

  const { error } = await supabase
    .from("cycle_picks")
    .insert(bookIds.map((bookId) => ({ cycle_id: cycleId, book_id: bookId, status: "selected" })));
  if (error) return fail(error.message);

  revalidatePath("/account");
  return { ok: true, message: "Your picks are saved." };
}

/* -------------------------------------------------------------------------- */
/* Payment submission                                                          */
/* -------------------------------------------------------------------------- */

export async function submitPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const session = await requireUser("/account/orders");
  const orderId = String(formData.get("order_id") ?? "");
  const method = String(formData.get("method") ?? "bkash");
  const amount = Number(formData.get("amount") ?? 0);
  const trxId = String(formData.get("trx_id") ?? "").trim();
  const senderNumber = String(formData.get("sender_number") ?? "").trim();
  const screenshot = String(formData.get("screenshot_url") ?? "").trim() || null;

  if (!orderId) return fail("Missing order.");
  if (!trxId) return fail("Enter the transaction ID (TrxID) from your payment SMS.");

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    user_id: session.userId,
    method,
    amount,
    trx_id: trxId,
    sender_number: senderNumber || null,
    screenshot_url: screenshot,
    status: "pending",
  });

  if (error) return fail(error.message);

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath("/account/orders");
  return {
    ok: true,
    message: "Payment submitted. We will verify it shortly and start your delivery.",
  };
}

/* -------------------------------------------------------------------------- */
/* Rare book requests + newsletter                                             */
/* -------------------------------------------------------------------------- */

export async function requestBookAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Tell us the title you are looking for.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const contact = String(formData.get("contact") ?? "").trim() || null;
  if (!user && !contact) return fail("Leave a phone number or email so we can reach you.");

  const { error } = await supabase.from("rare_requests").insert({
    user_id: user?.id ?? null,
    title,
    author: String(formData.get("author") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    contact,
    status: "pending",
  });

  if (error) return fail(error.message);

  revalidatePath("/rare");
  return { ok: true, message: "Request received. We will hunt it down and email you." };
}

export async function subscribeNewsletterAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return { ok: true, message: "Thanks! (demo mode)" };

  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return fail("Enter a valid email address.");

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error && !error.message.includes("duplicate")) return fail(error.message);

  return { ok: true, message: "You are on the list." };
}

/* -------------------------------------------------------------------------- */
/* Payment proof upload target                                                 */
/* -------------------------------------------------------------------------- */

export async function getPaymentTargets() {
  const payments = await getPaymentSettings();
  return payments;
}

/* -------------------------------------------------------------------------- */
/* Membership controls (customer side)                                         */
/* -------------------------------------------------------------------------- */

export async function cancelMySubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const session = await requireUser("/account");
  const id = String(formData.get("subscription_id") ?? "");
  if (!id) return fail("Missing subscription.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: String(formData.get("reason") ?? "").trim() || null,
    })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) return fail(error.message);

  revalidatePath("/account");
  revalidatePath("/account/membership");
  return {
    ok: true,
    message:
      "Membership cancelled. Return your outstanding books and we will refund your deposit.",
  };
}
