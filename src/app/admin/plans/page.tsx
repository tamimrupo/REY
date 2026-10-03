import { PlanForm } from "@/components/admin/plan-form";
import { EmptyState, StatusPill } from "@/components/ui";
import { getPlanFeatures, getPlans } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const [plans, features] = await Promise.all([getPlans(false), getPlanFeatures()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Plans &amp; pricing</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Change prices, book counts and deposit without touching code.
        </p>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Add your first plan with the form below — pricing, book count and deposit are all editable later."
        />
      ) : null}

      <div className="space-y-4">
        {plans.map((plan) => (
          <details key={plan.id} className="card p-6">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl font-semibold text-ink">{plan.name}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {money(plan.price_monthly)}/month · {plan.books_per_month} books ·{" "}
                  {money(plan.security_deposit)} deposit
                </p>
              </div>
              <div className="flex items-center gap-2">
                {plan.is_popular ? <StatusPill status="active" label="Popular" /> : null}
                <StatusPill
                  status={plan.is_active ? "active" : "draft"}
                  label={plan.is_active ? "Live" : "Hidden"}
                />
                <span className="text-xs text-ink-muted">Edit</span>
              </div>
            </summary>

            <div className="mt-6 border-t border-ink pt-6">
              <PlanForm plan={plan} features={features} />
            </div>
          </details>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Add a plan</h2>
        <p className="mt-1 text-sm text-ink-soft">
          New plans appear on the pricing page immediately.
        </p>
        <div className="mt-6">
          <PlanForm />
        </div>
      </section>
    </div>
  );
}
