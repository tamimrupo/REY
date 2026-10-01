"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The hairline that crosses the top of the viewport while a route loads.
 *
 * Navigation is the one wait a page cannot show by itself: between the click and
 * the new route there is nothing on screen. Two measures keep this quiet — the
 * bar only appears if the route takes longer than 120ms (prefetched routes
 * resolve well inside that), and it never intercepts a pointer.
 *
 * The phase is derived rather than assigned: the bar has "done" when the
 * pathname is no longer the one the navigation started from, which needs no
 * effect and cannot get out of step with the router.
 *
 * Every same-origin link click starts it, so it covers the header, the footer
 * and the cards alike. Navigations that no anchor sees announce themselves with
 * a `route:start` event (see the header search, which pushes programmatically).
 */

/** Under this, the route was instant and the bar would only be a flash. */
const SHOW_AFTER_MS = 120;
/** A navigation that never lands must not leave the bar on screen. */
const GIVE_UP_MS = 8000;
/** Time to let the completed bar fade before it can be used again. */
const FADE_OUT_MS = 400;

export function RouteProgress() {
  const pathname = usePathname();
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const giveUpTimer = useRef<number | null>(null);

  const arrived = startedFrom !== null && startedFrom !== pathname;
  const phase = arrived ? "done" : visible ? "running" : "idle";

  const start = useCallback(() => {
    if (showTimer.current !== null) window.clearTimeout(showTimer.current);
    if (giveUpTimer.current !== null) window.clearTimeout(giveUpTimer.current);

    setVisible(false);
    setStartedFrom(pathname);
    showTimer.current = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    giveUpTimer.current = window.setTimeout(() => {
      setVisible(false);
      setStartedFrom(null);
    }, GIVE_UP_MS);
  }, [pathname]);

  // Start: a click on a link that leads somewhere else, or a history move.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname && next.search === window.location.search) {
        return;
      }

      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener("route:start", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener("route:start", start);
    };
  }, [start]);

  // Let the completed bar finish its sweep, then go quiet for the next click.
  useEffect(() => {
    if (phase !== "done") return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      setStartedFrom(null);
    }, FADE_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return <div aria-hidden className="route-progress" data-phase={phase} />;
}
