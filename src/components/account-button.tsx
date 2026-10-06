"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The header's account affordance. Reads the session on the client (after the
 * page has loaded) so the header itself can be statically rendered. Defaults to
 * "Sign in" — the anonymous case — and flips to "My account" once the session
 * resolves.
 */
export function AccountButton({ className }: { className: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/quota", { headers: { accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setSignedIn(Boolean(d?.session)))
      .catch(() => {});
  }, []);

  return (
    <Link href={signedIn ? "/account" : "/login"} className={className}>
      {signedIn ? "My account" : "Sign in"}
    </Link>
  );
}
