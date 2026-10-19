import type { Metadata } from "next";

import { CheckoutForm, type CheckoutBook, type CheckoutCourier } from "@/components/checkout-form";
import { getSession } from "@/lib/auth";
import {
  getAddresses,
  getBookById,
  getCourierSettings,
  getMyDeposits,
  getPlans,
  listBooks,
} from "@/lib/data";
import { readPicks } from "@/lib/picks";
import { couriersFor } from "@/lib/quotas";
import type { Book } from "@/lib/types";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

function toCheckoutBook(book: Book): CheckoutBook {
  return {
    id: book.id,
    title: book.title,
    cover_url: book.cover_url,
    author: book.authors?.name ?? null,
    genre: book.genres?.name ?? null,
    language: book.language,
  };
}

/** The checkout picker needs the whole catalogue, not just the first page. */
async function loadCatalog(): Promise<Book[]> {
  const first = await listBooks({ perPage: 60, page: 1 });
  if (first.pages <= 1) return first.books;

  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, index) =>
      listBooks({ perPage: 60, page: index + 2 }),
    ),
  );

  return [first, ...rest].flatMap((page) => page.books);
}

export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const searchParams = await props.searchParams;
  const requestedPlan = typeof searchParams.plan === "string" ? searchParams.plan : null;

  const [picks, session] = await Promise.all([readPicks(), getSession()]);

  const [plans, courierSettings, catalog, pickedBooks, addresses, deposits] = await Promise.all([
    getPlans(),
    getCourierSettings(),
    loadCatalog(),
    Promise.all(picks.map((id) => getBookById(id))),
    session ? getAddresses(session.userId) : Promise.resolve([]),
    session ? getMyDeposits(session.userId) : Promise.resolve([]),
  ]);

  const booksById = new Map<string, CheckoutBook>();
  for (const book of [
    ...catalog,
    ...pickedBooks.filter((book): book is Book => Boolean(book)),
  ]) {
    booksById.set(book.id, toCheckoutBook(book));
  }

  const initialPicks = picks
    .map((id) => booksById.get(id))
    .filter((book): book is CheckoutBook => Boolean(book));

  const couriers: CheckoutCourier[] = couriersFor(courierSettings, "outbound");

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 text-ink">Your box</h1>
        <p className="mt-3 text-ink-soft">
          Pick your books, choose a plan, and create your account in one step. Your refundable
          deposit is charged once.
        </p>
      </div>

      <div className="mt-10">
        <CheckoutForm
          initialPicks={initialPicks}
          books={Array.from(booksById.values())}
          plans={plans}
          addresses={addresses}
          signedInEmail={session?.email ?? null}
          hasHeldDeposit={deposits.some((deposit) => deposit.status === "held")}
          couriers={couriers}
          defaultCourier={courierSettings.methods[0]?.key ?? "steadfast"}
          initialPlanSlug={requestedPlan}
          initialName={session?.profile?.full_name ?? ""}
          initialPhone={session?.profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
