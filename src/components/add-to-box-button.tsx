"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { addToBoxFormAction } from "@/lib/actions/storefront";

type QuotaState = {
  subscription: { status: string } | null;
  remaining: number;
  out: { book_id: string }[];
  box: { book_id: string }[];
  overdue: boolean;
};

/**
 * "Add to my box" call-to-action, resolved on the client so the book page can
 * be statically cached. The anonymous case (the default) shows "Sign in".
 */
export function AddToBoxButton({
  bookId,
  back,
  className = "btn btn-primary",
  label = "Add to my box",
}: {
  bookId: string;
  back: string;
  className?: string;
  label?: string;
}) {
  const [state, setState] = useState<QuotaState | null>(null);

  useEffect(() => {
    fetch("/api/quota", { headers: { accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setState(d?.session ? d.state : null))
      .catch(() => setState(null));
  }, []);

  if (!state) {
    return (
      <Link href={`/login?next=${encodeURIComponent(back)}`} className={className}>
        Sign in to pick this book
      </Link>
    );
  }

  if (!state.subscription || state.subscription.status !== "active") {
    return (
      <Link href="/plans" className={className}>
        Get a plan to rent this
      </Link>
    );
  }

  const inBox = state.box.some((rental) => rental.book_id === bookId);
  const out = state.out.some((rental) => rental.book_id === bookId);

  if (inBox || out) {
    return (
      <Link href="/account/box" className="btn btn-outline">
        {out ? "Already with you" : "In your box"} · review
      </Link>
    );
  }

  if (state.overdue) {
    return (
      <Link href="/account/books" className="btn btn-outline">
        Return overdue books first
      </Link>
    );
  }

  if (state.remaining < 1) {
    return (
      <Link href="/account/box" className="btn btn-outline">
        No slots left this month
      </Link>
    );
  }

  return (
    <form
      action={addToBoxFormAction}
      onSubmit={() => {
        // Fire the AddToCart signal before the server action runs — the action
        // redirects on success, so there is no later client-side moment to use.
        if (typeof window !== "undefined" && typeof window.fbq === "function") {
          window.fbq("track", "AddToCart", {
            content_ids: [bookId],
            content_type: "product",
          });
        }
      }}
    >
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="back" value={back} />
      <button type="submit" className={className}>
        {label} · {state.remaining} left
      </button>
    </form>
  );
}
