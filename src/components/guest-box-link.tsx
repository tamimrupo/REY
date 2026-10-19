"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { readPicksFromCookieString } from "@/lib/picks-shared";

function subscribePicks(onStoreChange: () => void) {
  window.addEventListener("rey:picks", onStoreChange);
  return () => window.removeEventListener("rey:picks", onStoreChange);
}

function getPicksCookie() {
  return document.cookie;
}

function getServerPicksCookie() {
  return "";
}

/**
 * "Box (2)" in the header. Reads the guest box cookie on the client so the
 * header — and every storefront page behind it — can stay statically cached.
 */
export function GuestBoxLink({ className }: { className: string }) {
  const cookieString = useSyncExternalStore(
    subscribePicks,
    getPicksCookie,
    getServerPicksCookie,
  );
  const count = readPicksFromCookieString(cookieString).length;

  if (!count) return null;

  return (
    <Link
      href="/checkout"
      className={className}
      aria-label={`Your box: ${count} book${count === 1 ? "" : "s"}`}
    >
      Box ({count})
    </Link>
  );
}
