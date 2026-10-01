import Link from "next/link";

import { Money } from "@/components/ui";
import { money } from "@/lib/format";
import type { Plan, PlanFeature } from "@/lib/types";

/**
 * A plan set as a specification column: a rule on top, the price in display
 * type, and the features as hairline rows — the same ledger language the book
 * page uses for its details. No box, no lift, no glyph bullets: three columns
 * side by side read as one comparison instead of three competing cards.
 */
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
      className={`flex h-full flex-col border-t pt-6 ${
        plan.is_popular ? "border-ink" : "border-line"
      }`}
    >
      <p className={`label-mono ${plan.is_popular ? "text-ink" : ""}`}>
        {plan.is_popular ? "Most popular" : "\u00a0"}
      </p>

      <h3 className="mt-3 font-display text-2xl font-bold text-ink">{plan.name}</h3>
      {plan.tagline ? <p className="mt-1.5 text-sm text-ink-muted">{plan.tagline}</p> : null}

      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold text-ink">
          <Money value={money(plan.price_monthly)} />
        </span>
        <span className="text-sm text-ink-muted">/month</span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{plan.books_per_month} books / month</p>

      <ul className="mt-6 divide-y divide-line border-y border-line text-sm text-ink-soft">
        {planFeatures.map((feature) => (
          <li key={feature.id} className="py-2.5">
            {feature.feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="space-y-1 text-meta text-ink-muted">
          <p>
            Security deposit 1st time · refundable{" "}
            <span className="font-medium text-ink-soft">{money(plan.security_deposit)}</span>
          </p>
          <p>Delivery from ৳40 · free with BD Post · check your package on arrival</p>
        </div>

        <Link
          href={`/subscribe/${plan.slug}`}
          className={`${plan.is_popular ? "btn btn-primary" : "btn btn-outline"} mt-5 w-full`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
