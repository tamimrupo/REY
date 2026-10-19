"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";

import { pickBookAction, unpickBookAction } from "@/lib/actions/storefront";
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
 * The guest call-to-action on a book page. Picking does not need an account:
 * the book goes into a cookie box, and the account is created at checkout.
 *
 * The book page stays statically cached because the cookie is read here, on
 * the client, through an external-store subscription.
 */
export function GuestPickButton({
  bookId,
  className = "btn btn-primary",
}: {
  bookId: string;
  className?: string;
}) {
  const cookieString = useSyncExternalStore(
    subscribePicks,
    getPicksCookie,
    getServerPicksCookie,
  );
  const picks = readPicksFromCookieString(cookieString);
  const picked = picks.includes(bookId);
  const count = picks.length;

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (run: (formData: FormData) => Promise<void>) => (formData: FormData) => {
    startTransition(async () => {
      await run(formData);
      // The server action has set the cookie by the time it resolves; notify
      // every subscriber (this button and the header's box link) to re-read.
      window.dispatchEvent(new Event("rey:picks"));
    });
  };

  const pick = submit(async (formData) => {
    const result = await pickBookAction(null, formData);
    setError(result?.ok ? null : (result?.message ?? "Could not add that book."));
  });

  const remove = submit(async (formData) => {
    const result = await unpickBookAction(null, formData);
    setError(result?.ok ? null : (result?.message ?? "Could not remove that book."));
  });

  if (picked) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/checkout" className={className}>
          Picked · view box ({count})
        </Link>
        <form action={remove}>
          <input type="hidden" name="book_id" value={bookId} />
          <button type="submit" className="btn btn-ghost" disabled={pending}>
            {pending ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <form
        action={pick}
        onSubmit={() => {
          // Report the signal before the server action runs; the page stays
          // put, so this is the only moment the pixel can fire.
          if (typeof window !== "undefined" && typeof window.fbq === "function") {
            window.fbq("track", "AddToCart", {
              content_ids: [bookId],
              content_type: "product",
            });
          }
        }}
      >
        <input type="hidden" name="book_id" value={bookId} />
        <button type="submit" className={className} disabled={pending}>
          {pending ? "Adding…" : "Pick this book"}
        </button>
      </form>
      {count > 0 ? (
        <Link
          href="/checkout"
          className="mt-2 inline-block text-xs text-ink-muted underline hover:text-ink"
        >
          View your box ({count})
        </Link>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
