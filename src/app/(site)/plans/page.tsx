import Link from "next/link";

import { PlanCard } from "@/components/plan-card";
import { EmptyState, SectionHeading } from "@/components/ui";
import { getCourierSettings, getPlanFeatures, getPlans } from "@/lib/data";
import { couriersFor } from "@/lib/quotas";
import { money } from "@/lib/format";

export const metadata = { title: "Subscription plans" };

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
      <section className="border-b border-line bg-gradient-to-b from-cream to-paper">
        <div className="container-page py-16 text-center">
          <p className="eyebrow">Membership</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold text-ink sm:text-5xl">
            Pick the number of books. We handle the rest.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-ink-soft">
            Every plan includes the refundable security deposit, monthly swaps and full library
            access. Change or cancel your plan at the start of any month.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deliveryOptions.map((option) => (
            <div key={option.key} className="card p-5">
              <p className="font-medium text-ink">{option.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">
                {option.charge === 0 ? "Free" : money(option.charge)}
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

      <section className="border-t border-line bg-ink py-16 text-paper">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold text-paper">
            Still deciding? Browse the shelves first.
          </h2>
          <p className="max-w-xl text-sm text-paper/70">
            The library has thousands of English and Bangla titles, from biographies to translated
            classics.
          </p>
          <Link href="/library" className="btn btn-gold">
            Browse the library
          </Link>
        </div>
      </section>
    </>
  );
}
