import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { FeaturedShelf } from "@/components/featured-shelf";
import { PlanCard } from "@/components/plan-card";
import { EmptyState, SectionHeading, SetupNotice } from "@/components/ui";
import {
  getCourierSettings,
  getPlanFeatures,
  getPlans,
  getShelfBooks,
  listBooks,
} from "@/lib/data";
import { couriersFor } from "@/lib/quotas";
import { dhakaDayIndex, pickForToday, rotateForToday } from "@/lib/daily";
import { money } from "@/lib/format";

export default async function HomePage() {
  const [plans, features, shelfBooks, rare, courierSettings] = await Promise.all([
    getPlans(),
    getPlanFeatures(),
    getShelfBooks(14),
    listBooks({ onlyRare: true, perPage: 5 }),
    getCourierSettings(),
  ]);

  // Rank the shelf by real borrow counts, then rotate it once a day so the
  // line-up looks different every morning.
  const rankedShelf = [...shelfBooks.books].sort(
    (a, b) => (b.borrowed ?? 0) - (a.borrowed ?? 0) || a.title.localeCompare(b.title),
  );

  const dayIndex = dhakaDayIndex();
  const shelf = rotateForToday(rankedShelf, dayIndex);

  // Label the shelf honestly: only promise "most borrowed" once books have
  // actually been borrowed.
  const hasLoans = rankedShelf.some((book) => (book.borrowed ?? 0) > 0);
  const shelfLabels = hasLoans
    ? ["Most borrowed this month", "Readers' favourites", "Still in demand", "Back by demand"]
    : ["Fresh on the shelves", "Recently added", "New in the library", "On the shelves today"];
  const shelfLabel = pickForToday(shelfLabels, dayIndex);

  const couriers = couriersFor(courierSettings, "outbound");
  const deposit = plans[0]?.security_deposit ?? 500;
  const maxBooks = plans.length ? Math.max(...plans.map((plan) => plan.books_per_month)) : 8;

  const stats = [
    { value: String(plans.length || 3), label: "Plans", detail: "2, 4 or 8 books a month" },
    {
      value: String(couriers.length),
      label: "Couriers",
      detail: couriers.map((courier) => courier.label).join(" · ") || "Nationwide",
    },
    {
      value: money(deposit),
      label: "Refundable deposit",
      detail: "Back when you leave and return",
    },
    { value: "1–4", label: "Days to your door", detail: "Dhaka and all 64 districts" },
  ];

  const steps = [
    {
      number: "01",
      title: "Pick a plan",
      body: `Two, four or eight books a month. Your ${money(deposit)} deposit is refundable, and you can pause or cancel whenever.`,
      tag: "Cancel anytime",
    },
    {
      number: "02",
      title: "Choose your titles",
      body: "Search the library by title, author, genre or language and drop the ones you want into your box.",
      tag: "You choose, not us",
    },
    {
      number: "03",
      title: "We deliver, you read",
      body: "Pay by bKash or Nagad, we verify it, and the courier brings your books. Return or swap them next month.",
      tag: "Swap on one trip",
    },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-paper">
        <div className="container-page grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="eyebrow">Book rental club · Dhaka, Bangladesh</p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl">
              Choose your plan,
              <br />
              pick your books.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Subscribe monthly, select exactly the titles you want, and we deliver them to your
              door. Read, return, swap. No shelf to dust, no guilt about the ones you never got to.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/plans" className="btn btn-primary">
                Start a plan
              </Link>
              <Link href="/library" className="btn btn-outline">
                Browse the library
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-4 gap-y-8">
            {shelfBooks.books.length ? (
              shelfBooks.books.slice(0, 6).map((book) => <BookCard key={book.id} book={book} />)
            ) : (
              <div className="col-span-3 rounded-2xl border border-line bg-cream p-8">
                <p className="eyebrow">Your first box</p>
                <div className="mt-5 flex items-end gap-2" aria-hidden>
                  {[68, 92, 56, 80, 64].map((height, index) => (
                    <span
                      key={index}
                      className="w-6 rounded-t-sm bg-gradient-to-b from-mist to-frost ring-1 ring-line"
                      style={{ height }}
                    />
                  ))}
                </div>
                <p className="mt-6 text-sm leading-relaxed text-ink-soft">
                  Two to eight titles a month, chosen by you. Add books from the dashboard and they
                  appear right here.
                </p>
                <Link href="/library" className="btn btn-outline btn-sm mt-5">
                  Open the library
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Proof strip */}
        <div className="border-y border-line bg-cream/60">
          <div className="container-page grid gap-x-10 gap-y-7 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold leading-none tracking-tight text-ink tabular-nums">
                  {stat.value}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-ink">
                    {stat.label}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink-muted">
                    {stat.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page pt-10">
        <SetupNotice />
      </div>

      {/* ------------------------------------------------------ How it works */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHeading
              eyebrow="How it works"
              title="Three moves from sign-up to your first box"
              description="We handle the warehousing, the couriers and the chasing. You just decide what to read next."
            />

            <div className="grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="border-t-2 border-ink pt-5">
                  <p className="text-xs font-semibold tracking-[0.14em] text-brand">{step.number}</p>
                  <h3 className="mt-3 text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  <p className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                    {step.tag}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Plans */}
      <section id="plans" className="border-b border-line bg-cream">
        <div className="container-page py-20">
          <SectionHeading
            eyebrow="Membership"
            title="Plans built around how much you actually read"
            description={`Every plan includes the refundable deposit, monthly swaps and the full library. The most you can hold at once is ${maxBooks} books.`}
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
        </div>
      </section>

      {/* ------------------------------------------- Featured author shelf */}
      {shelf.length ? (
        <section className="border-b border-line bg-paper">
          <div className="container-page py-20">
            <FeaturedShelf books={shelf} label={shelfLabel}>
              <h2 className="mt-3 text-3xl sm:text-4xl">Keep the story going.</h2>
              <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
                Do not let the story end just yet. Continue with the shelf below, or start somewhere
                new — every title is delivered to your door and collected when you are done.
              </p>
              <Link href="/library" className="btn btn-primary mt-8">
                Start reading <span aria-hidden>↗</span>
              </Link>
            </FeaturedShelf>
          </div>
        </section>
      ) : (
        <section className="border-b border-line bg-paper">
          <div className="container-page py-20">
            <EmptyState
              title="The shelves are empty"
              description="Add your first titles from Dashboard → Books, or run the seed SQL to load the starter catalog."
              actionHref="/admin/books/new"
              actionLabel="Add a book"
            />
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- Proof */}
      <section className="bg-ink">
        <div className="container-page py-20">
          <p className="eyebrow text-gold-soft">The club in numbers</p>
          <h2 className="mt-4 max-w-2xl text-paper">
            A rental club is only as good as the books on the shelf and the courier at the door.
          </h2>

          <dl className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                value: String(shelfBooks.total || shelfBooks.books.length),
                label: "Titles in the library",
                detail: "And growing every week",
              },
              { value: String(plans.length || 3), label: "Ways to join", detail: "2, 4 or 8 books a month" },
              {
                value: "2",
                label: "Trips a month",
                detail: "New books out, finished books back",
              },
              { value: "100%", label: "Deposit returned", detail: "Once your books come home" },
            ].map((item) => (
              <div key={item.label} className="border-t border-white/20 pt-5">
                <dt className="text-4xl font-extrabold tracking-tight text-paper">{item.value}</dt>
                <dd className="mt-2 text-sm font-semibold text-paper">{item.label}</dd>
                <dd className="mt-1 text-xs text-paper/60">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- Rare */}
      {rare.books.length > 0 ? (
        <section className="border-b border-line bg-cream">
          <div className="container-page py-20">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <SectionHeading
                  eyebrow="Rare & hard to find"
                  title="Not on the shelves? Ask for it."
                  description="Out-of-print Bangla classics, imported hardbacks, academic volumes that never reach a local shop. Tell us what you are hunting for and we will do the legwork."
                />
                <Link href="/rare" className="btn btn-primary mt-8">
                  Request a book
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {rare.books.slice(0, 6).map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- CTA */}
      <section className="bg-paper">
        <div className="container-page py-20">
          <div className="panel px-8 py-14 text-center">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mx-auto mt-4 max-w-2xl">
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
        </div>
      </section>
    </>
  );
}
