import { PickBooksForm } from "@/components/account/pick-books-form";
import type { PickBook } from "@/components/subscribe-form";
import { Alert, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription, getSelectingCycle, listBooks } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "This month's picks" };

export default async function PicksPage() {
  const session = await requireUser("/account/picks");
  const subscription = await getActiveSubscription(session.userId);

  if (!subscription) {
    return (
      <EmptyState
        title="No active membership"
        description="Pick a plan to start choosing books."
        actionHref="/plans"
        actionLabel="See the plans"
      />
    );
  }

  const [cycle, catalog] = await Promise.all([
    getSelectingCycle(subscription.id),
    listBooks({ perPage: 60 }),
  ]);

  const limit = subscription.plans?.books_per_month ?? 2;

  if (!cycle) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-ink">This month&apos;s picks</h1>
        <Alert tone="success">
          Your picks for this cycle are in. We will email you when it is time to choose again.
        </Alert>
      </div>
    );
  }

  const books: PickBook[] = catalog.books.map((book) => ({
    id: book.id,
    title: book.title,
    cover_url: book.cover_url,
    author: book.authors?.name ?? null,
    genre: book.genres?.name ?? null,
    language: book.language,
  }));

  const currentPicks = (cycle.cycle_picks ?? []).map((pick) => pick.book_id);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Cycle #{cycle.cycle_number}</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Choose your books</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Pick exactly {limit} title{limit === 1 ? "" : "s"} for this cycle. Started{" "}
          {formatDate(cycle.period_start)}. You can change these until the box is packed.
        </p>
      </div>

      <PickBooksForm
        cycleId={cycle.id}
        limit={limit}
        books={books}
        currentPicks={currentPicks}
      />
    </div>
  );
}
