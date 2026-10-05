"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { siteUrl, supabaseConfigured } from "@/lib/env";
import { sendMetaEvent } from "@/lib/meta";
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

  if (error) {
    // Supabase refuses the whole signup when its mailer is throttled, so this
    // error is the difference between "try again later" and "you are losing
    // customers". Point at the cause.
    if (/rate limit|too many|429/i.test(error.message)) {
      return fail(
        "Too many confirmation emails have been sent from this project just now. Supabase's built-in mailer only allows a few per hour. Wait a few minutes — and connect your own SMTP before launch (Brevo is free; see the README).",
      );
    }
    if (/already registered|already exists|already been registered/i.test(error.message)) {
      return fail("That email already has an account. Try signing in, or reset your password.");
    }
    return fail(error.message);
  }

  // Meta's server-side conversions stream: report the sign-up with the cookies
  // the browser pixel left behind. `after` keeps the redirect instant even when
  // the ad network is slow.
  const jar = await cookies();
  const head = await headers();
  const fbp = jar.get("_fbp")?.value ?? null;
  const fbc = jar.get("_fbc")?.value ?? null;
  const clientIp = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = head.get("user-agent") ?? null;
  after(() =>
    sendMetaEvent({
      name: "CompleteRegistration",
      eventId: `signup-${data.user?.id ?? email}`,
      email,
      phone,
      fbp,
      fbc,
      clientIp,
      userAgent,
      contentName: "REY BD sign-up",
    }),
  );

  // Email confirmation turned off → straight in.
  if (data.session) redirect(next);

  // Confirmation required → send them to a dedicated screen with a resend button.
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

/** Re-sends the sign-up confirmation email. */
export async function resendConfirmationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured) return fail(NOT_READY);

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return fail("Enter your email address.");

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=%2Faccount` },
  });

  if (error) {
    if (/rate limit|too many|429/i.test(error.message)) {
      return fail(
        "Too many emails have been sent just now. Supabase's built-in mailer allows only a few per hour — wait a few minutes, or connect your own SMTP (Brevo is free).",
      );
    }
    return fail(error.message);
  }

  return { ok: true, message: "Sent. Check your inbox and your spam folder." };
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
  if (error) {
    // The most common support question in the first week: "it says wrong
    // password but I just signed up". It is almost always an unconfirmed email.
    if (/not confirmed/i.test(error.message)) {
      return fail(
        "Your email is not confirmed yet. Open the link we emailed you — or use “Resend confirmation” below.",
      );
    }
    return fail(error.message);
  }

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
