import Link from "next/link";

import { Alert, EmptyState, StatusPill } from "@/components/ui";
import { ConfirmBoxPanel, type CourierOption } from "@/components/account/box-forms";
import { addToBoxFormAction } from "@/lib/actions/storefront";
import { requireUser } from "@/lib/auth";
import { getAddresses, getCourierSettings, getMembershipState, listBooks } from "@/lib/data";
import { couriersFor } from "@/lib/quotas";

export const metadata = { title: "My box" };

export default async function BoxPage(props: PageProps<"/account/box">) {
  const session = await requireUser("/account/box");
  const search = await props.searchParams;

  const state = await getMembershipState(session.userId);

  if (!state.subscription || !state.plan) {
    return (
      <EmptyState
        title="No active membership"
        description="Pick a plan and you can start filling your box straight away."
        actionHref="/plans"
        actionLabel="See the plans"
      />
    );
  }

  const [catalog, addresses, courierSettings] = await Promise.all([
    listBooks({ perPage: 24 }),
    getAddresses(session.userId),
    getCourierSettings(),
  ]);

  const couriers: CourierOption[] = couriersFor(courierSettings, "outbound");
  const takenIds = new Set([...state.box, ...state.out].map((rental) => rental.book_id));
  const canAdd = state.remaining > 0 && !state.overdue && state.subscription.status === "active";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">My box</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {state.plan.name} · {state.quota} books a month ·{" "}
            <span className="font-medium text-ink">{state.remaining} slot(s) left</span>
          </p>
        </div>
        <Link href="/account/books" className="btn btn-outline btn-sm">
          Books with me ({state.out.length})
        </Link>
      </div>

      {search.added ? <Alert tone="success">Book added to your box.</Alert> : null}
      {search.error ? <Alert tone="error">{String(search.error)}</Alert> : null}

      {state.overdue ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">
              You have overdue books, so new picks are blocked until they come back.
            </p>
            <Link href="/account/books" className="btn btn-outline btn-sm">
              Return books
            </Link>
          </div>
        </Alert>
      ) : null}

      {state.subscription.status !== "active" ? (
        <Alert tone="warning">
          Your membership is <strong>{state.subscription.status}</strong>. Renew to keep picking
          books.{" "}
          <Link href="/account/membership" className="underline">
            Manage membership
          </Link>
        </Alert>
      ) : null}

      {state.box.length ? (
        <ConfirmBoxPanel
          box={state.box}
          couriers={couriers}
          addresses={addresses}
          isSwap={state.isSwap}
          defaultCourier={courierSettings.methods[0]?.key ?? "steadfast"}
          outCount={state.out.length}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Your box is empty</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Add up to {state.remaining} book{state.remaining === 1 ? "" : "s"} below, then confirm the
            box and we will send them.
          </p>
        </div>
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">Add books</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {canAdd
                ? `You can add ${state.remaining} more title${state.remaining === 1 ? "" : "s"} this month.`
                : state.overdue
                  ? "Return your overdue books first."
                  : state.remaining < 1
                    ? "All your slots for this month are used. Return or swap to free them up."
                    : "Renew your membership to keep adding books."}
            </p>
          </div>
          <Link href="/library" className="btn btn-outline btn-sm">
            Search the full library
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {catalog.books.map((book) => {
            const already = takenIds.has(book.id);
            return (
              <div key={book.id} className="overflow-hidden rounded-xl border border-line bg-white">
                <Link href={`/library/${book.slug}`} className="block">
                  <div className="aspect-[2/3] w-full overflow-hidden bg-cream">
                    {book.cover_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between p-3">
                        <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted">
                          {book.genres?.name ?? "REY"}
                        </span>
                        <span className="font-display text-xs font-semibold leading-snug text-ink">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-ink">
                    {book.title}
                  </p>
                  <p className="mt-1 text-[0.65rem] text-ink-muted">{book.authors?.name ?? "—"}</p>

                  <div className="mt-3">
                    {already ? (
                      <StatusPill
                        status="pending"
                        label={state.out.some((r) => r.book_id === book.id) ? "With you" : "In box"}
                      />
                    ) : canAdd ? (
                      <form action={addToBoxFormAction}>
                        <input type="hidden" name="book_id" value={book.id} />
                        <input type="hidden" name="back" value="/account/box" />
                        <button type="submit" className="btn btn-primary btn-sm w-full">
                          Add
                        </button>
                      </form>
                    ) : (
                      <button type="button" disabled className="btn btn-outline btn-sm w-full">
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
