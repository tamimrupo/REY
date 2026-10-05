"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";

/**
 * Google Analytics 4, loaded only when NEXT_PUBLIC_GA_ID is set.
 *
 * The admin dashboard is left out: staff visits would otherwise swamp the
 * reports, and none of those screens are part of the shopfront funnel.
 */
export function Analytics() {
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();

  if (!gaId || pathname.startsWith("/admin")) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
