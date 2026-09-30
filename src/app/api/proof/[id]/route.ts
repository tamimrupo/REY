import { notFound, redirect } from "next/navigation";

import { getSession, isAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Streams a payment screenshot to the owner or an admin via a short-lived
 * signed URL. The bucket itself stays private.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/proof/[id]">) {
  const { id } = await ctx.params;
  if (!supabaseConfigured) notFound();

  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/api/proof/${id}`)}`);

  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, screenshot_url")
    .eq("id", id)
    .maybeSingle();

  if (!payment?.screenshot_url) notFound();
  if (payment.user_id !== session.userId && !isAdmin(session)) redirect("/account");

  const { data } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(payment.screenshot_url, 300);

  if (!data?.signedUrl) notFound();
  redirect(data.signedUrl);
}
