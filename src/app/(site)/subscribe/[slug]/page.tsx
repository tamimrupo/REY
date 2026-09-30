import { notFound } from "next/navigation";

import { SubscribeForm, type PickBook } from "@/components/subscribe-form";
import { requireUser } from "@/lib/auth";
import { getAddresses, getCourierSettings, getPlanBySlug, getPlanFeatures, listBooks } from "@/lib/data";
import { couriersFor } from "@/lib/quotas";
import { money } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/subscribe/[slug]">) {
  const { slug } = await props.params;
  const plan = await getPlanBySlug(slug);
  return { title: plan ? `Subscribe · ${plan.name}` : "Subscribe" };
}

export default async function SubscribePage(props: PageProps<"/subscribe/[slug]">) {
  const { slug } = await props.params;
  const session = await requireUser(`/subscribe/${slug}`);

  const [plan, features, catalog, addresses, courierSettings] = await Promise.all([
    getPlanBySlug(slug),
    getPlanFeatures(),
    listBooks({ perPage: 60 }),
    getAddresses(session.userId),
    getCourierSettings(),
  ]);

  if (!plan || !plan.is_active) notFound();

  const books: PickBook[] = catalog.books.map((book) => ({
    id: book.id,
    title: book.title,
    cover_url: book.cover_url,
    author: book.authors?.name ?? null,
    genre: book.genres?.name ?? null,
    language: book.language,
  }));

  const planFeatures = features.filter((feature) => feature.plan_id === plan.id);

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">Subscribe</p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">{plan.name}</h1>
        <p className="mt-3 text-ink-soft">
          {money(plan.price_monthly)} / month · {plan.books_per_month} books a month ·{" "}
          {money(plan.security_deposit)} refundable deposit
        </p>
        {planFeatures.length ? (
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {planFeatures.map((feature) => (
              <li key={feature.id} className="flex items-center gap-2">
                <span aria-hidden className="text-gold">
                  ✦
                </span>
                {feature.feature}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-12">
        <SubscribeForm
          plan={plan}
          books={books}
          addresses={addresses}
          couriers={couriersFor(courierSettings, "outbound")}
          defaultCourier={courierSettings.methods[0]?.key ?? "steadfast"}
        />
      </div>
    </div>
  );
}
