"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { quoteCourier } from "@/lib/quotas";
import {
  getCourierSettings,
  getMembershipState,
  getPaymentSettings,
  getPlanBySlug,
} from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fail(message: string): ActionState {
  return { ok: false, message };
}

const NOT_READY = "Supabase is not connected yet. Add your project keys to .env.local first.";

/** Turns a Postgres RAISE EXCEPTION into a message worth showing a customer. */
function rpcMessage(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";
  const raw = (error as { message?: string }).message ?? String(error);
  return raw.replace(/^[\w\s]*ERROR:\s*/i, "").replace(/^P0001:\s*/i, "").trim();
}

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
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.userId);
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

/**
 * Creates the membership, the first box (rentals) and the outbound shipment.
 * The customer pays for the plan, the refundable deposit and the first
 * delivery; the books themselves are free.
 */
export async function startSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const planSlug = String(formData.get("plan") ?? "");
  const session = await requireUser(`/subscribe/${planSlug}`);

  const plan = await getPlanBySlug(planSlug);
  if (!plan) return fail("That plan is no longer available.");

  const bookIds = formData.getAll("books").map((v) => String(v)).filter(Boolean);
  if (bookIds.length === 0) return fail("Pick at least one book for your first box.");
  if (bookIds.length > plan.books_per_month) {
    return fail(`Your plan allows ${plan.books_per_month} books.`);
  }

  const supabase = await createClient();

  // Reuse a saved address, or create one from the form.
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
  const couriers = await getCourierSettings();
  const deliveryFee = quoteCourier(couriers, courier, "outbound").customer_charge;

  const { data: existingDeposit } = await supabase
    .from("deposits")
    .select("id")
    .eq("user_id", session.userId)
    .eq("status", "held")
    .maybeSingle();
  const depositAmount = existingDeposit ? 0 : Number(plan.security_deposit);

  const subtotal = Number(plan.price_monthly);
  const total = subtotal + depositAmount + deliveryFee;

  // 1. the membership (pending until the payment is verified)
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .insert({ user_id: session.userId, plan_id: plan.id, status: "pending" })
    .select("id")
    .single();
  if (subError) return fail(subError.message);

  // 2. the order
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
      courier,
      trip_type: "outbound",
      notes: `Courier: ${courier}`,
    })
    .select("id, order_number")
    .single();
  if (orderError) return fail(orderError.message);

  // 3. the books, as rentals waiting in the box
  const { error: rentalError } = await supabase.from("rentals").insert(
    bookIds.map((bookId) => ({
      user_id: session.userId,
      subscription_id: subscription.id,
      book_id: bookId,
      order_id: order.id,
      status: "pending",
      due_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })),
  );
  if (rentalError) return fail(rentalError.message);

  const { data: rentals } = await supabase
    .from("rentals")
    .select("id, book_id, books(title)")
    .eq("order_id", order.id);

  // 4. the first trip
  const { data: shipment } = await supabase
    .from("shipments")
    .insert({
      user_id: session.userId,
      order_id: order.id,
      subscription_id: subscription.id,
      address_id: addressId,
      type: "outbound",
      courier,
      status: "pending",
      customer_charge: deliveryFee,
      merchant_charge: 0,
    })
    .select("id")
    .single();

  if (shipment && rentals?.length) {
    await supabase.from("shipment_items").insert(
      rentals.map((rental: { id: string }) => ({
        shipment_id: shipment.id,
        rental_id: rental.id,
        direction: "out",
      })),
    );
  }

  // 5. the invoice lines
  const bookLines = ((rentals ?? []) as any[]).map((rental) => ({
    order_id: order.id,
    book_id: rental.book_id as string,
    label: `Rental — ${rental.books?.title ?? "Book"}`,
    quantity: 1,
    unit_price: 0,
  }));

  await supabase.from("order_items").insert([
    ...bookLines,
    { order_id: order.id, label: `Plan — ${plan.name} (month 1)`, quantity: 1, unit_price: subtotal },
    ...(depositAmount > 0
      ? [{ order_id: order.id, label: "Refundable security deposit", quantity: 1, unit_price: depositAmount }]
      : []),
    ...(deliveryFee > 0
      ? [{ order_id: order.id, label: `Delivery — ${courier}`, quantity: 1, unit_price: deliveryFee }]
      : []),
  ]);

  redirect(`/checkout/${order.id}`);
}

/* -------------------------------------------------------------------------- */
/* The monthly box                                                             */
/* -------------------------------------------------------------------------- */

export async function addToBoxAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const bookId = String(formData.get("book_id") ?? "");
  const back = String(formData.get("back") ?? "/library");
  await requireUser(back);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_to_box", { p_book_id: bookId });
  if (error) return fail(rpcMessage(error));

  revalidatePath(back);
  revalidatePath("/account");
  revalidatePath("/account/box");

  const result = data as { remaining?: number } | null;
  return {
    ok: true,
    message:
      result?.remaining === 0
        ? "Added. Your box is full — confirm it to get your books."
        : `Added. ${result?.remaining ?? 0} slot(s) left this month.`,
  };
}

export async function removeFromBoxAction(formData: FormData) {
  if (!supabaseConfigured) return;
  await requireUser("/account/box");
  const rentalId = String(formData.get("rental_id") ?? "");
  if (!rentalId) return;

  const supabase = await createClient();
  await supabase.rpc("remove_from_box", { p_rental_id: rentalId });
  revalidatePath("/account/box");
  revalidatePath("/account");
}

/**
 * Form-friendly variant used by "Add to box" buttons on book pages: one request
 * per book, and the page re-renders with the new box state.
 */
export async function addToBoxFormAction(formData: FormData) {
  if (!supabaseConfigured) return;
  const bookId = String(formData.get("book_id") ?? "");
  const back = String(formData.get("back") ?? "/account/box");
  await requireUser(back);

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_to_box", { p_book_id: bookId });

  const target = error
    ? `/account/box?error=${encodeURIComponent(rpcMessage(error))}`
    : `${back}${back.includes("?") ? "&" : "?"}added=1`;

  revalidatePath(back);
  revalidatePath("/account/box");
  revalidatePath("/account");
  revalidatePath("/library");
  redirect(target);
}

export async function confirmBoxAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const session = await requireUser("/account/box");

  const courier = String(formData.get("courier") ?? "steadfast");
  const addressId = String(formData.get("address_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_box", {
    p_courier: courier,
    p_address_id: addressId,
  });
  if (error) return fail(rpcMessage(error));

  const result = data as { order_id?: string | null; trip?: string; fee?: number } | null;

  await supabase
    .from("profiles")
    .update({ courier_preference: courier })
    .eq("id", session.userId);

  revalidatePath("/account");
  revalidatePath("/account/box");

  // A swap or first send may carry a courier fee worth paying.
  if (result?.order_id) redirect(`/checkout/${result.order_id}`);
  redirect("/account/books?confirmed=1");
}

export async function saveCourierPreferenceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const session = await requireUser("/account/membership");
  const courier = String(formData.get("courier") ?? "steadfast");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ courier_preference: courier })
    .eq("id", session.userId);
  if (error) return fail(error.message);

  revalidatePath("/account/membership");
  return { ok: true, message: "Delivery preference saved." };
}

/* -------------------------------------------------------------------------- */
/* Returns + deposits                                                          */
/* -------------------------------------------------------------------------- */

export async function requestReturnAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  await requireUser("/account/books");

  const courier = String(formData.get("courier") ?? "steadfast");
  const receipt = String(formData.get("bdpost_receipt") ?? "").trim();
  const addressId = String(formData.get("address_id") ?? "").trim() || null;
  const agreed = formData.get("bdpost_agree") === "on";

  if (courier === "bdpost" && !agreed) {
    return fail("Please confirm the BD Post Book Packet rules before choosing a free return.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_return", {
    p_courier: courier,
    p_receipt: receipt,
    p_address_id: addressId,
  });
  if (error) return fail(rpcMessage(error));

  const result = data as { order_id?: string | null; books?: number; fee?: number } | null;

  revalidatePath("/account/books");
  revalidatePath("/account");

  if (result?.order_id) redirect(`/checkout/${result.order_id}`);
  redirect("/account/books?returned=1");
}

export async function requestDepositRefundAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const session = await requireUser("/account/membership");

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_deposit_refund");
  if (error) return fail(rpcMessage(error));

  await supabase
    .from("deposits")
    .update({ refund_requested_note: String(formData.get("note") ?? "").trim() || null })
    .eq("user_id", session.userId)
    .eq("status", "held");

  revalidatePath("/account/membership");
  revalidatePath("/account/payments");
  return {
    ok: true,
    message: "Refund requested. We will send it to your bKash/Nagad number within 7 working days.",
  };
}

/* -------------------------------------------------------------------------- */
/* Renewals                                                                    */
/* -------------------------------------------------------------------------- */

/** Raises a renewal order so the next month can be paid for. */
export async function createRenewalOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);
  const session = await requireUser("/account/membership");

  const state = await getMembershipState(session.userId);
  if (!state.subscription || !state.plan) return fail("You have no plan to renew.");
  if (state.subscription.status === "pending") return fail("Finish your first payment first.");

  const courier = String(formData.get("courier") ?? "steadfast");
  const couriers = await getCourierSettings();
  const deliveryFee = quoteCourier(couriers, courier, "outbound").customer_charge;
  const subtotal = Number(state.plan.price_monthly);
  const total = subtotal + deliveryFee;

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: session.userId,
      subscription_id: state.subscription.id,
      type: "renewal",
      status: "pending_payment",
      subtotal,
      delivery_fee: deliveryFee,
      total,
      courier,
      trip_type: "outbound",
      notes: `Renewal — ${state.plan.name}`,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  await supabase.from("order_items").insert([
    { order_id: order.id, label: `Plan — ${state.plan.name} (renewal)`, quantity: 1, unit_price: subtotal },
    ...(deliveryFee > 0
      ? [{ order_id: order.id, label: `Delivery — ${courier}`, quantity: 1, unit_price: deliveryFee }]
      : []),
  ]);

  redirect(`/checkout/${order.id}`);
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
  return { ok: true, message: "Request received. We will hunt it down and let you know." };
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

export async function getPaymentTargets() {
  return getPaymentSettings();
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
      "Membership cancelled. Return any books you still have and we will refund your deposit.",
  };
}
