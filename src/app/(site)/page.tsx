import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { BookCoverImage } from "@/components/book-cover";
import { FeaturedShelf } from "@/components/featured-shelf";
import { CountUp, Reveal } from "@/components/motion";
import { PlanCard } from "@/components/plan-card";
import { EmptyState, SectionHeading, SetupNotice, Money } from "@/components/ui";
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
  void stats;

  // The three questions a first-time visitor has, answered above the fold.
  const cheapestPlan = plans.length
    ? plans.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b))
    : null;

  const heroFacts = [
    {
      value: cheapestPlan ? money(cheapestPlan.price_monthly) : "৳299",
      label: "From, monthly",
    },
    { value: money(deposit), label: "Deposit, refundable" },
    { value: String(couriers.length), label: "Courier partners" },
    { value: "1–4", label: "Days to your door" },
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
      <section className="relative bg-paper">
        {/* ---- The image: full-bleed down the right side on wide screens ---- */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero/reader-1880.jpg"
            alt="Young woman reading at a book stand — painting by Osman Hamdi Bey, 1880"
            width={1440}
            height={1131}
            className="h-full w-full object-cover object-[66%_30%] grayscale contrast-[1.06]"
          />
          <p className="label-mono absolute bottom-5 left-5 max-w-[13rem] border border-line bg-paper px-2.5 py-1.5 leading-relaxed">
            “Young woman reading”, Osman Hamdi Bey, 1880 — public domain
          </p>
        </div>

        {/* ---- The pitch ---- */}
        <div className="container-page relative grid gap-y-10 pb-12 pt-12 lg:grid-cols-[1.22fr_0.4fr] lg:py-20">
          <Reveal className="flex flex-col">
            <div className="flex max-w-[42rem] items-center gap-4">
              <span className="label-mono !text-ink-soft">Book rental club — Dhaka, Bangladesh</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span className="label-mono !text-ink-soft">Est. 2026</span>
            </div>

            <h1 className="mt-8">
              A new book every month,
              <br />
              at your door.
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft">
              Pick two, four or eight titles from the library. We deliver them, you read them, and
              when the month is up we collect them and bring your next box. Refundable deposit,
              cancel whenever.
            </p>

            <div className="mt-9 flex max-w-[42rem] flex-wrap items-center gap-3">
              <Link href="/plans" className="btn btn-primary">
                Start your plan — from {money(cheapestPlan?.price_monthly ?? 299)}/mo
                <span aria-hidden>→</span>
              </Link>
              <Link href="/library" className="btn btn-outline">
                Browse all {shelfBooks.total} books
              </Link>
            </div>

            <dl className="mt-12 grid max-w-[42rem] grid-cols-2 gap-x-6 gap-y-5 border-t border-ink pt-6 sm:grid-cols-4 lg:mt-14 lg:pt-7">
              {heroFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-serif text-2xl font-semibold leading-none tracking-tight text-ink">
                    <Money value={fact.value} />
                  </dt>
                  <dd className="label-mono mt-2">{fact.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div aria-hidden className="hidden lg:block" />
        </div>

        {/* ---- The same image on narrow screens ---- */}
        <div className="border-t border-ink lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero/reader-1880.jpg"
            alt="Young woman reading at a book stand — painting by Osman Hamdi Bey, 1880"
            width={1440}
            height={1131}
            className="h-[230px] w-full object-cover object-[66%_30%] grayscale contrast-[1.06] sm:h-[320px]"
          />
        </div>
      </section>

      <div className="container-page pt-10">
        <SetupNotice />
      </div>

      {/* ------------------------------------------------------ How it works */}
      <section className=" bg-paper">
        <div className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <SectionHeading
                eyebrow="How it works"
                title="Three moves from sign-up to your first box"
                description="We handle the warehousing, the couriers and the chasing. You just decide what to read next."
              />
            </Reveal>

            <div className="grid gap-10 sm:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal
                  key={step.number}
                  delay={index * 110}
                  className="border-t border-ink pt-5"
                >
                  <p className="text-xs font-semibold tracking-[0.14em] text-brand">{step.number}</p>
                  <h3 className="mt-3 text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  <p className="label-mono mt-4">
                    {step.tag}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Proof
          Before the ask, not after it: real club numbers first, plans second. */}
      <section className="bg-ink">
        <div className="container-page py-20">
          <Reveal>
            <div className="section-rule border-ink/25">
              <span className="label-mono !text-paper/70">The club in numbers</span>
              <span aria-hidden className="h-px flex-1 bg-white/20" />
            </div>
            <h2 className="mt-6 max-w-3xl text-paper">
              A rental club is only as good as the books on the shelf and the courier at the door.
            </h2>
          </Reveal>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:mt-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
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
            ].map((item, index) => (
              <Reveal
                key={item.label}
                delay={index * 90}
                className="border-t border-white/20 pt-5"
              >
                <dt className="font-display text-4xl font-bold tracking-tight text-paper">
                  <CountUp value={item.value} />
                </dt>
                <dd className="mt-2 text-sm font-semibold text-paper">{item.label}</dd>
                <dd className="mt-1 text-xs text-paper/60">{item.detail}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- Plans */}
      <section id="plans" className=" bg-cream">
        <div className="container-page py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Membership"
              title="Plans built around how much you actually read"
              description={`Every plan includes the refundable deposit, monthly swaps and the full library. The most you can hold at once is ${maxBooks} books.`}
            />
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal key={plan.id} delay={index * 110} className="flex">
                <PlanCard plan={plan} features={features} />
              </Reveal>
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
        <section className=" bg-paper">
          <Reveal className="container-page py-20">
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
          </Reveal>
        </section>
      ) : (
        <section className=" bg-paper">
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

      {/* --------------------------------------------------------------- Rare */}
      {rare.books.length > 0 ? (
        <section className=" bg-cream">
          <div className="container-page py-20">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <Reveal>
                <SectionHeading
                  eyebrow="Rare & hard to find"
                  title="Not on the shelves? Ask for it."
                  description="Out-of-print Bangla classics, imported hardbacks, academic volumes that never reach a local shop. Tell us what you are hunting for and we will do the legwork."
                />
                <Link href="/rare" className="btn btn-primary mt-8">
                  Request a book
                </Link>
              </Reveal>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {rare.books.slice(0, 6).map((book, index) => (
                  <Reveal key={book.id} delay={index * 70}>
                    <BookCard book={book} />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden border-t border-line bg-paper">
        {/* The library drifting past behind the offer: two rows of the covers,
            tilted and shadowed like posters on a wall, one row each way. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-5 py-8"
        >
          {[0, 1].map((row) => (
            <div
              key={row}
              className={`flex w-max gap-5 ${row === 0 ? "marquee-left" : "marquee-right"}`}
            >
              {[...shelfBooks.books, ...shelfBooks.books].map((book, index) => (
                <div
                  key={`${row}-${book.id}-${index}`}
                  className={`h-44 w-28 shrink-0 overflow-hidden rounded-card border border-line bg-mist shadow-tile sm:h-52 sm:w-36 ${
                    index % 3 === 0 ? "-rotate-3" : index % 3 === 1 ? "rotate-2" : "rotate-[3.5deg]"
                  }`}
                >
                  <BookCoverImage
                    url={book.cover_url}
                    title={book.title}
                    size="md"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Enough paper to read through, not enough to hide the wall. */}
        <div aria-hidden className="absolute inset-0 bg-paper/60" />

        <div className="container-page relative py-28">
          <Reveal className="mx-auto max-w-2xl rounded-card border border-line bg-paper/95 px-8 py-12 text-center shadow-paper">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mt-4">Your next twelve books are one plan away.</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Every cover on this wall is on our shelves. Pick a plan and they start moving.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/plans" className="btn btn-primary">
                See the plans
              </Link>
              <Link href="/how-it-works" className="btn btn-outline">
                How it works
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
