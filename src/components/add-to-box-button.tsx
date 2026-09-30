import Link from "next/link";

import { addToBoxFormAction } from "@/lib/actions/storefront";
import { getSession } from "@/lib/auth";
import { getMembershipState } from "@/lib/data";

/**
 * "Add to my box" / "Start a plan" — the book-page call to action.
 * Renders a plain form so it works without any client JavaScript.
 */
export async function AddToBoxButton({
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
  const session = await getSession();

  if (!session) {
    return (
      <Link href={`/login?next=${encodeURIComponent(back)}`} className={className}>
        Sign in to pick this book
      </Link>
    );
  }

  const state = await getMembershipState(session.userId);

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
    <form action={addToBoxFormAction}>
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="back" value={back} />
      <button type="submit" className={className}>
        {label} · {state.remaining} left
      </button>
    </form>
  );
}
