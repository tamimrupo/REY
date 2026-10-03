import Link from "next/link";

import { Money } from "@/components/ui";
import { money } from "@/lib/format";
import type { Plan, PlanFeature } from "@/lib/types";

/**
 * A plan as a card: white, hairline border, real shadow so it sits above the
 * page rather than on it, and a lift under the pointer.
 *
 * The recommended plan is the same card made taller, bordered in ink and given
 * the deeper shadow — no colour, no ribbon, no badge beyond the mono label.
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
      className={`lift flex h-full flex-col rounded-card border bg-white p-6 ${
        plan.is_popular ? "border-ink shadow-lift lg:-my-3" : "border-line shadow-paper"
      }`}
    >
      <p className={`label-mono ${plan.is_popular ? "text-ink" : ""}`} aria-hidden={!plan.is_popular}>
        {plan.is_popular ? "Most popular" : null}
      </p>

      <h3 className="mt-3 font-display text-2xl font-bold text-ink">{plan.name}</h3>
      {plan.tagline ? <p className="mt-1.5 text-sm text-ink-muted">{plan.tagline}</p> : null}

      <p className="mt-7 flex items-baseline gap-1">
        <span className="font-display text-5xl font-bold tracking-tight text-ink">
          <Money value={money(plan.price_monthly)} />
        </span>
        <span className="text-sm text-ink-muted">/month</span>
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">{plan.books_per_month} books / month</p>

      <ul className="mt-7 divide-y divide-line border-y border-line text-sm text-ink-soft">
        {planFeatures.map((feature) => (
          <li key={feature.id} className="py-2.5">
            {feature.feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="space-y-1 text-meta text-ink-muted">
          <span className="block">
            Security deposit 1st time · refundable{" "}
            <span className="font-medium text-ink-soft">{money(plan.security_deposit)}</span>
          </span>
          <span className="block">
            <span className="font-medium text-ink">Free delivery with BD Post</span> · otherwise
            from ৳40 · check your package on arrival
          </span>
        </p>

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
