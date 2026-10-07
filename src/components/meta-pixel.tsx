"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta Pixel for the shopfront — Facebook and Instagram ads share one pixel.
 *
 * Loaded only when NEXT_PUBLIC_META_PIXEL_ID is set, and never inside /admin.
 * Each route change sends a PageView, so single-page navigation is counted the
 * same as a full load. Purchases and sign-ups are reported server-side (see
 * src/lib/meta.ts); the pixel stays the browser half of the pair.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  const lastTracked = useRef<string | null>(null);
  const firstRun = useRef(true);
  // Meta IDs are 15–16 digits. A mangled value — two IDs pasted together, a
  // stray character — would otherwise be injected into the page and rejected
  // at runtime; refuse to render instead.
  const usable = /^\d{15,16}$/.test(pixelId);

  useEffect(() => {
    if (!usable || pathname.startsWith("/admin")) return;

    // The inline snippet below sends the PageView for a full page load. This
    // effect exists for client-side navigation after it, so it stays silent on
    // its own first run — otherwise the load would be counted twice.
    if (firstRun.current) {
      firstRun.current = false;
      lastTracked.current = pathname;
      return;
    }

    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, usable]);

  if (!usable || pathname.startsWith("/admin")) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
    </Script>
  );
}
