import type { Metadata } from "next";

import { CmsArticle, MissingPage } from "@/components/cms-article";
import { getCmsPage, getCmsPages } from "@/lib/data";
import { clipDescription } from "@/lib/seo";

/**
 * Curated meta descriptions for the legal/info pages. Their CMS excerpts are
 * too short to be useful in a SERP, so we override them here (still editable
 * in the CMS — these just guarantee the 120–155 character band).
 */
const LEGAL_DESCRIPTIONS: Record<string, string> = {
  faq: "Answers to common questions about REY BD plans, payments, deposits, returns, damage and delivery — everything you need before you start your first box.",
  "privacy-policy":
    "How REY BD collects, uses and protects your personal data, what we never do with it, and how to ask us to update or remove your information.",
  "security-deposit-guide":
    "How the refundable ৳500 security deposit works at REY BD — when it is charged, how it is returned, and the few cases where part of it is deducted.",
  "shipping-delivery-policy":
    "Where REY BD delivers across Bangladesh, our courier partners, how long delivery takes, what it costs, and what happens if a handover is missed.",
  "rental-rules":
    "How to care for your borrowed REY BD books, what counts as fair wear and tear, borrowing limits, and what we ask so every title stays in circulation.",
  "return-refund-deposit-policy":
    "How returns, refunds and the security deposit work at REY BD — return windows, how damage is assessed, and how quickly refunds reach your bKash or Nagad.",
  "terms-conditions":
    "The terms of your REY BD membership — eligibility, billing, the security deposit, care standards, delivery, and when a membership may be paused.",
  "about-us":
    "REY BD is a book rental club in Dhaka that delivers English and Bangla titles across Bangladesh, so you read more without filling a shelf.",
  "how-it-works":
    "Rent books in three steps with REY BD — pick a plan, choose your titles, and we deliver to your door and collect the ones you have finished.",
};

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getCmsPage(slug);
  const excerpt = page?.excerpt?.trim();
  const description =
    LEGAL_DESCRIPTIONS[slug] ??
    (excerpt && excerpt.length >= 120
      ? clipDescription(excerpt)
      : page
        ? clipDescription(
            `Read ${page.title} — from REY BD's book rental club in Dhaka, delivering English and Bangla titles across Bangladesh.`,
          )
        : undefined);
  return {
    title: page?.title ?? "Page",
    description,
    alternates: { canonical: page ? `/p/${page.slug}` : undefined },
    openGraph: { url: page ? `/p/${page.slug}` : undefined },
  };
}

export async function generateStaticParams() {
  const pages = await getCmsPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function CmsPageRoute(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const page = await getCmsPage(slug);
  if (!page) return <MissingPage slug={slug} />;
  return <CmsArticle page={page} />;
}
