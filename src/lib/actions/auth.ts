"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { siteUrl, supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

function fail(message: string): ActionState {
  return { ok: false, message };
}

const NOT_READY =
  "Supabase is not connected yet. Add your project keys to .env.local first.";

/* -------------------------------------------------------------------------- */
/* Sign up / sign in / sign out                                                */
/* -------------------------------------------------------------------------- */

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const next = String(formData.get("next") ?? "/account");

  if (!email || !password) return fail("Email and password are required.");
  if (password.length < 6) return fail("Password must be at least 6 characters.");
  if (!fullName) return fail("Please tell us your name.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return fail(error.message);

  // Email confirmation turned off → straight in.
  if (data.session) redirect(next);

  return {
    ok: true,
    message:
      "Account created. Check your inbox for a confirmation link, then sign in.",
  };
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!email || !password) return fail("Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message);

  redirect(next);
}

export async function signOutAction() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return fail("Enter your email address.");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=%2Faccount%2Fpassword`,
  });
  if (error) return fail(error.message);

  return { ok: true, message: "Password reset link sent. Check your inbox." };
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in again.");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) return fail(error.message);

  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 6) return fail("Password must be at least 6 characters.");
  if (password !== confirm) return fail("Passwords do not match.");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error.message);

  return { ok: true, message: "Password changed." };
}
