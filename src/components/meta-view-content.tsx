"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires Meta's ViewContent event once per book detail page, so the pixel sees
 * the top of the funnel (product views) alongside the checkout events. Renders
 * nothing; it only reports the view through the existing `window.fbq` queue.
 */
export function TrackViewContent({ contentId }: { contentId: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", {
        content_ids: [contentId],
        content_type: "product",
      });
    }
  }, [contentId]);

  return null;
}
