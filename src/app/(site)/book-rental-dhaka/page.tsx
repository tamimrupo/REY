import Link from "next/link";

import { getPlans } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata = {
  title: "Book Rental in Dhaka — Rent Books Delivered to Your Door",
  description:
    "Book rental in Dhaka with REY BD. Rent 2, 4 or 8 books a month from ৳299, delivered to your door by Steadfast, Pathao, RedX or BD Post, and collected when you're done.",
  alternates: { canonical: "/book-rental-dhaka" },
};

export default async function BookRentalDhakaPage() {
  const plans = await getPlans();
  const cheapest = plans.length
    ? plans.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b))
    : null;

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-page pb-12 pt-10">
          <p className="eyebrow">Book rental in Dhaka</p>
          <h1 className="mt-3 max-w-3xl">Rent books in Dhaka, delivered to your door</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft">
            REY BD is a book rental club based in Nikunjo, Dhaka. Pick 2, 4 or 8 titles a month, we
            deliver them anywhere in Dhaka — and across Bangladesh — then collect them when the
            month is up.
            {cheapest ? ` Plans start at ${money(cheapest.price_monthly)}/month` : ""} with a
            refundable ৳500 security deposit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/plans" className="btn btn-primary">
              See the plans
            </Link>
            <Link href="/how-it-works" className="btn btn-outline">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="section-rule">
          <span className="label-mono">Why rent instead of buy</span>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-card border border-line bg-white p-6 shadow-paper">
            <h2 className="text-lg font-semibold text-ink">Cheaper than a shelf of one-reads</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              A hardcover costs the better part of a day&apos;s wages, and you finish it in a week.
              Rent it, read it, return it — and keep the money.
            </p>
          </div>
          <div className="rounded-card border border-line bg-white p-6 shadow-paper">
            <h2 className="text-lg font-semibold text-ink">No clutter</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Books are meant to travel, not gather dust. We collect the finished ones and bring
              your next box on the same trip.
            </p>
          </div>
          <div className="rounded-card border border-line bg-white p-6 shadow-paper">
            <h2 className="text-lg font-semibold text-ink">Always something new</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Swap every month. New arrivals land on the shelf every week, and members get priority
              on them.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-ink bg-cream">
        <div className="container-page py-16">
          <div className="section-rule">
            <span className="label-mono">How it works</span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="label-mono">01</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">Pick a plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Two, four or eight books a month. Cancel or pause anytime, and your deposit comes
                back in full.
              </p>
            </div>
            <div>
              <p className="label-mono">02</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">Choose your titles</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Search the library by title, author, genre or language and drop the ones you want
                into your box.
              </p>
            </div>
            <div>
              <p className="label-mono">03</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">We deliver, you read</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Pay by bKash, Nagad or Rocket. The courier brings your books, and returns or swaps
                them next month.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="section-rule">
              <span className="label-mono">Delivery</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
            </div>
            <h2 className="mt-7 text-2xl font-semibold text-ink">
              Delivered across Dhaka — and Bangladesh
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              We run four courier partners. Steadfast, Pathao and RedX deliver in Dhaka for ৳80
              (you pay half); BD Post is free. Most boxes land in 1&ndash;4 days. We collect your
              finished books on the same run that drops the next box.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/library" className="btn btn-primary">
                Browse the library
              </Link>
              <Link href="/p/shipping-delivery-policy" className="btn btn-ghost">
                Delivery policy
              </Link>
            </div>
          </div>
          <div className="rounded-card border border-line bg-white p-6 shadow-paper">
            <p className="label-mono">Visit or reach us</p>
            <p className="mt-4 text-sm leading-relaxed text-ink">
              House # 28, Road # 8/A, Nikunjo-1, Dhaka-1229
              <br />
              +880 17921 02092
              <br />
              hello@rey.bd
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
