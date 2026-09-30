import Link from "next/link";

import { Money } from "@/components/ui";
import { money } from "@/lib/format";
import type { Plan, PlanFeature } from "@/lib/types";

export function PlanCard({
  plan,
  features,
  ctaLabel = "Choose plan",
}: {
  plan: Plan;
  features: PlanFeature[];
  ctaLabel?: string;
}) {
  const planFeatures = features
    .filter((f) => f.plan_id === plan.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div
      className={`lift relative flex h-full flex-col rounded-2xl border bg-white p-6 ${
        plan.is_popular ? "border-ink shadow-[0_18px_40px_-28px_rgba(22,19,17,0.55)]" : "border-line"
      }`}
    >
      {plan.is_popular ? (
        <span className="absolute -top-3 left-6 rounded-full bg-ink px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-paper">
          Most popular
        </span>
      ) : null}

      <h3 className="font-display text-xl font-semibold text-ink">{plan.name}</h3>
      {plan.tagline ? <p className="mt-1.5 text-sm text-ink-muted">{plan.tagline}</p> : null}

      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-semibold text-ink">
          <Money value={money(plan.price_monthly)} />
        </span>
        <span className="text-sm text-ink-muted">/month</span>
      </p>
      <p className="mt-1 text-sm font-medium text-ink-soft">
        {plan.books_per_month} books / month
      </p>

      <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
        {planFeatures.map((feature) => (
          <li key={feature.id} className="flex gap-2.5">
            <span aria-hidden className="mt-0.5 text-gold">
              ✦
            </span>
            <span>{feature.feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-4 border-t border-line pt-5">
        <div className="space-y-1 text-xs text-ink-muted">
          <p>
            Security deposit 1st time · refundable{" "}
            <span className="font-semibold text-ink-soft">{money(plan.security_deposit)}</span>
          </p>
          <p>Delivery from ৳40 · free with BD Post · check your package on arrival</p>
        </div>

        <Link href={`/subscribe/${plan.slug}`} className="btn btn-primary w-full">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
