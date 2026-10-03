import Link from "next/link";

import { CmsArticle, MissingPage } from "@/components/cms-article";
import { getCmsPage } from "@/lib/data";

export const metadata = { title: "How it works" };

/** The three moves, as circles — the reference's device, in our own type. */
const steps = [
  {
    n: "01",
    title: "Pick a plan",
    body: "Two, four or eight books a month, from ৳299. The ৳500 security deposit is refundable, and you can pause or cancel whenever.",
    note: "Cancel anytime",
  },
  {
    n: "02",
    title: "Choose your titles",
    body: "Search the library by title, author, genre or language in English or Bangla, and drop the ones you want into your box.",
    note: "You choose, not us",
  },
  {
    n: "03",
    title: "We deliver, you read",
    body: "Pay by bKash or Nagad, we verify it, and the courier brings your books — free with BD Post. Return or swap them next month.",
    note: "Swap on one trip",
  },
];

/**
 * How it works.
 *
 * The opening and the three steps are designed here; the words underneath are
 * the CMS page you edit in Admin → Pages, rendered without its own masthead so
 * there is only one heading on the page.
 */
export default async function HowItWorksPage() {
  const page = await getCmsPage("how-it-works");
  if (!page) return <MissingPage slug="how-it-works" />;

  return (
    <>
      <section className="border-b border-line bg-cream">
        <div className="container-page py-20 text-center">
          <p className="eyebrow">How it works</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-ink">
            Twelve books a year, <em className="italic">without the shelf.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            Pick a plan, choose your titles each month, and we bring them to your door — then
            collect them when the month is up.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/plans" className="btn btn-primary">
              See the plans
            </Link>
            <Link href="/library" className="btn btn-outline">
              Browse the library
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-10">
          {steps.map((step) => (
            <div key={step.n}>
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-ink font-display text-xl font-bold text-ink">
                {step.n}
              </span>
              <h2 className="mt-5 text-2xl">{step.title}</h2>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">{step.body}</p>
              <p className="label-mono mt-5">{step.note}</p>
            </div>
          ))}
        </div>
      </section>

      <CmsArticle page={page} hideMasthead />
    </>
  );
}
