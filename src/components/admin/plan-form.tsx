"use client";

import { ActionForm } from "@/components/forms/action-form";
import { deletePlanAction, savePlanAction } from "@/lib/actions/admin";
import type { Plan, PlanFeature } from "@/lib/types";

export function PlanForm({
  plan,
  features,
}: {
  plan?: Plan | null;
  features?: PlanFeature[];
}) {
  const featureText = (features ?? [])
    .filter((feature) => feature.plan_id === plan?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((feature) => feature.feature)
    .join("\n");

  return (
    <ActionForm
      action={savePlanAction}
      submitLabel={plan ? "Save plan" : "Create plan"}
      pendingLabel="Saving…"
      className="space-y-5"
      footer={
        plan ? (
          <button
            type="submit"
            formAction={deletePlanAction}
            className="btn btn-ghost text-ink"
            formNoValidate
          >
            Delete plan
          </button>
        ) : null
      }
    >
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`name-${plan?.id ?? "new"}`}>
            Plan name *
          </label>
          <input
            id={`name-${plan?.id ?? "new"}`}
            name="name"
            required
            className="field"
            defaultValue={plan?.name ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor={`slug-${plan?.id ?? "new"}`}>
            Slug
          </label>
          <input
            id={`slug-${plan?.id ?? "new"}`}
            name="slug"
            className="field"
            defaultValue={plan?.slug ?? ""}
            placeholder="auto from name"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`tagline-${plan?.id ?? "new"}`}>
          Tagline
        </label>
        <input
          id={`tagline-${plan?.id ?? "new"}`}
          name="tagline"
          className="field"
          defaultValue={plan?.tagline ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor={`price-${plan?.id ?? "new"}`}>
            Price / month
          </label>
          <input
            id={`price-${plan?.id ?? "new"}`}
            name="price_monthly"
            type="number"
            step="0.01"
            className="field"
            defaultValue={plan?.price_monthly ?? 0}
          />
        </div>
        <div>
          <label className="label" htmlFor={`books-${plan?.id ?? "new"}`}>
            Books / month
          </label>
          <input
            id={`books-${plan?.id ?? "new"}`}
            name="books_per_month"
            type="number"
            min={1}
            className="field"
            defaultValue={plan?.books_per_month ?? 2}
          />
        </div>
        <div>
          <label className="label" htmlFor={`deposit-${plan?.id ?? "new"}`}>
            Security deposit
          </label>
          <input
            id={`deposit-${plan?.id ?? "new"}`}
            name="security_deposit"
            type="number"
            step="0.01"
            className="field"
            defaultValue={plan?.security_deposit ?? 500}
          />
        </div>
        <div>
          <label className="label" htmlFor={`sort-${plan?.id ?? "new"}`}>
            Order
          </label>
          <input
            id={`sort-${plan?.id ?? "new"}`}
            name="sort_order"
            type="number"
            className="field"
            defaultValue={plan?.sort_order ?? 0}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`features-${plan?.id ?? "new"}`}>
          Features — one per line
        </label>
        <textarea
          id={`features-${plan?.id ?? "new"}`}
          name="features"
          rows={4}
          className="field"
          defaultValue={featureText}
          placeholder={"Pick 2 books at a time\nReturn or swap each month"}
        />
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_popular" defaultChecked={plan?.is_popular ?? false} />
          Highlight as most popular
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={plan?.is_active ?? true} />
          Available to buy
        </label>
      </div>
    </ActionForm>
  );
}
