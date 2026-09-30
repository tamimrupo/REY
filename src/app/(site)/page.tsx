import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { PlanCard } from "@/components/plan-card";
import { EmptyState, SectionHeading, SetupNotice } from "@/components/ui";
import { getPlanFeatures, getPlans, listBooks } from "@/lib/data";

export default async function HomePage() {
  const [plans, features, trending, rare] = await Promise.all([
    getPlans(),
    getPlanFeatures(),
    listBooks({ perPage: 10, sort: "title" }),
    listBooks({ onlyRare: true, perPage: 5 }),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-gradient-to-b from-cream to-paper">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="eyebrow">Book rental club · Dhaka, Bangladesh</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              Choose your plan,
              <br />
              pick your books.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Subscribe monthly, select exactly the titles you want, and we deliver them to your
              door. Read, return, swap. No shelf to dust, no guilt about the ones you never got to.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plans" className="btn btn-primary">
                Start a plan
              </Link>
              <Link href="/library" className="btn btn-outline">
                Browse the library
              </Link>
            </div>

            <dl className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
              {[
                { term: "Refundable deposit", detail: "৳500, returned when you leave" },
                { term: "Four couriers", detail: "Steadfast · Pathao · RedX · BD Post" },
                { term: "Free swapping", detail: "Return or change books every month" },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="text-sm font-semibold text-ink">{item.term}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-ink-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-3 gap-x-4 gap-y-8">
            {trending.books.length ? (
              trending.books.slice(0, 6).map((book) => (
                <BookCard key={book.id} book={book} />
              ))
            ) : (
              <div className="col-span-3 rounded-2xl border border-line bg-white/70 p-8">
                <p className="eyebrow">Your first box</p>
                <div className="mt-5 flex items-end gap-2" aria-hidden>
                  {[68, 92, 56, 80, 64].map((height, index) => (
                    <span
                      key={index}
                      className="w-6 rounded-t-sm bg-gradient-to-b from-cream to-[#e0d3bd] ring-1 ring-line"
                      style={{ height }}
                    />
                  ))}
                </div>
                <p className="mt-6 text-sm leading-relaxed text-ink-soft">
                  Two to eight titles a month, chosen by you. Add books from the dashboard and they
                  will show up right here.
                </p>
                <Link href="/library" className="btn btn-outline btn-sm mt-5">
                  Open the library
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-page pt-10">
        <SetupNotice />
      </div>

      {/* --------------------------------------------------------------- Plans */}
      <section id="plans" className="container-page py-20">
        <SectionHeading
          eyebrow="Membership"
          title="Three plans, one very good habit"
          description="Every plan includes the refundable security deposit, monthly swaps and access to the full library. Pick the number of books, not the number of rules."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} features={features} />
          ))}
        </div>

        {plans.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">
            No plans yet. Add them from the dashboard once your database is connected.
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------------------- How to */}
      <section className="border-y border-line bg-white">
        <div className="container-page grid gap-10 py-16 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Pick a plan",
              body: "Two, four or eight books a month. Cancel whenever — your deposit comes back.",
            },
            {
              step: "02",
              title: "Choose your titles",
              body: "Search the library by author, genre or language and build your box.",
            },
            {
              step: "03",
              title: "We deliver",
              body: "Pay by bKash or Nagad, we verify, and your books arrive in 1–4 days.",
            },
          ].map((item) => (
            <div key={item.step}>
              <p className="font-display text-3xl font-semibold text-gold-soft">{item.step}</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Trending */}
      <section className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="On the shelves"
            title="Trending essentials"
            description="The titles members are swapping for most this month."
          />
          <Link href="/library" className="btn btn-outline btn-sm">
            View all
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {trending.books.slice(0, 10).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {trending.books.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="The shelves are empty"
              description="Add your first titles from Dashboard → Books, or run the seed SQL to load the starter catalog of 16 books."
              actionHref="/admin/books/new"
              actionLabel="Add a book"
            />
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------- Rare */}
      {rare.books.length > 0 ? (
        <section className="border-y border-line bg-ink py-20 text-paper">
          <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Rare &amp; hard to find</p>
              <h2 className="mt-3 text-3xl font-semibold text-paper sm:text-4xl">
                We do not rent these yet — request one and we will try to add it.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-paper/70">
                Out-of-print Bangla classics, academic volumes, imported hardbacks. Tell us what you
                are hunting for and we will do the legwork.
              </p>
              <Link href="/rare" className="btn btn-gold mt-8">
                Request a book
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {rare.books.slice(0, 6).map((book) => (
                <div key={book.id} className="[&_p]:text-paper/80">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------------- CTA */}
      <section className="container-page py-20">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-cream to-white px-8 py-14 text-center">
          <p className="eyebrow">Ready when you are</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold text-ink sm:text-4xl">
            Your next twelve books are one plan away.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/plans" className="btn btn-primary">
              See the plans
            </Link>
            <Link href="/how-it-works" className="btn btn-outline">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
