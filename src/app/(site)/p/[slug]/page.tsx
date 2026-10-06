import type { Metadata } from "next";

import { CmsArticle, MissingPage } from "@/components/cms-article";
import { getCmsPage, getCmsPages } from "@/lib/data";

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getCmsPage(slug);
  return {
    title: page?.title ?? "Page",
    description: page?.excerpt ?? undefined,
    alternates: { canonical: page ? `/p/${page.slug}` : undefined },
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
