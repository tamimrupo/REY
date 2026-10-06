import Link from "next/link";

import { PlanCard } from "@/components/plan-card";
import { EmptyState, SectionHeading } from "@/components/ui";
import { getCourierSettings, getPlanFeatures, getPlans } from "@/lib/data";
import { couriersFor } from "@/lib/quotas";
import { money } from "@/lib/format";

export const metadata = {
  title: "Book Subscription Plans",
  description:
    "Rent 2, 4 or 8 books a month with REY BD. Plans from ৳299/month with home delivery across Bangladesh and a refundable deposit.",
  alternates: { canonical: "/plans" },
};

export default async function PlansPage() {
  const [plans, features, courierSettings] = await Promise.all([
    getPlans(),
    getPlanFeatures(),
    getCourierSettings(),
  ]);

  const deliveryOptions = couriersFor(courierSettings, "outbound");
  const minDelivery = deliveryOptions.length
    ? Math.min(...deliveryOptions.map((option) => option.charge))
    : 0;

  return (
    <>
      <section className="border-b border-line bg-cream">
        <div className="container-page py-16">
          <p className="eyebrow">Membership</p>
          <h1 className="mt-3 max-w-3xl text-ink">
            Pick the number of books. We handle the rest.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft">
            Every plan includes the refundable security deposit, monthly swaps and full library
            access. Change or cancel your plan at the start of any month.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* The cards carry h3 titles, so the grid needs its own h2 parent. */}
        <h2 className="sr-only">Choose your plan</h2>
        {plans.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} features={features} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No plans published yet"
            description="Create your Starter / Avid / Collector plans from Dashboard → Plans, or run the seed SQL to load the three defaults."
            actionHref="/admin/plans"
            actionLabel="Open plans"
          />
        )}
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="What you pay on day one"
              title="The first payment, explained"
              description="Your first order is the monthly plan fee plus the one-time refundable deposit and the delivery charge. After that you only pay the monthly fee."
            />
          </div>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="card flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-ink">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {money(plan.price_monthly)} plan + {money(plan.security_deposit)} deposit +{" "}
                    {money(minDelivery)} delivery
                  </p>
                </div>
                <p className="font-display text-lg font-semibold text-ink">
                  {money(Number(plan.price_monthly) + Number(plan.security_deposit) + minDelivery)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Delivery"
          title="Four couriers, and we split the cost"
          description="Each courier has a rate, and you only pay your share. BD Post is free when the Book Post rules are followed, and you can check the package before you accept it."
        />
        {/* The national service is free, so it leads. The paid couriers are the
            alternative, not the offer. */}
        {deliveryOptions
          .filter((option) => option.charge === 0)
          .map((option) => (
            <div
              key={option.key}
              className="mt-8 flex flex-col gap-5 border-t border-ink pt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
            >
              <div>
                <p className="label-mono">{option.label} · Book Post</p>
                <p className="mt-3 font-display text-4xl font-bold text-ink">Free</p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                  Bangladesh Post carries printed books at no cost through its Book Post service.
                  Follow their rules when you hand the parcel over — and check the package on
                  arrival, as you can with every courier we use.
                </p>
              </div>
              <a
                href="https://bdpost.gov.bd/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-6 items-center gap-1 text-sm font-medium text-ink underline decoration-ink/30 hover:decoration-ink"
              >
                Bangladesh Post <span aria-hidden>↗</span>
              </a>
            </div>
          ))}

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {deliveryOptions
            .filter((option) => option.charge > 0)
            .map((option) => (
              <div key={option.key} className="border-t border-ink pt-4">
                <p className="label-mono">{option.label}</p>
                <p className="mt-3 font-display text-2xl font-bold text-ink">
                  {money(option.charge)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {courierSettings.methods.find((m) => m.key === option.key)
                    ? `Your share of the ${money(
                        courierSettings.methods.find((m) => m.key === option.key)?.charge ?? 0,
                      )} courier charge`
                    : "Return option"}
                </p>
              </div>
            ))}
        </div>
      </section>

      <section className="border-t border-ink bg-ink py-16 text-paper">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl text-paper">
            Still deciding? Browse the shelves first.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-paper/70">
            The library has thousands of English and Bangla titles, from biographies to translated
            classics.
          </p>
          <Link href="/library" className="btn btn-primary">
            Browse the library
          </Link>
        </div>
      </section>
    </>
  );
}
