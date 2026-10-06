import type { MetadataRoute } from "next";

import { getAuthors, getCmsPages, getPlans, listBooks } from "@/lib/data";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [authors, cmsPages, plans] = await Promise.all([
    getAuthors(),
    getCmsPages(),
    getPlans(),
  ]);

  // Pull every active book, paginating through listBooks (capped at 60/page).
  const bookSlugs: string[] = [];
  let page = 1;
  for (;;) {
    const result = await listBooks({ page, perPage: 60 });
    for (const book of result.books) bookSlugs.push(book.slug);
    if (page >= result.pages) break;
    page += 1;
  }

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/plans", priority: 0.9 },
    { path: "/library", priority: 0.9 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/authors", priority: 0.6 },
    { path: "/rare", priority: 0.5 },
    { path: "/about-us", priority: 0.5 },
    { path: "/contact", priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      changeFrequency: "monthly" as const,
      priority: p.priority,
    })),
    ...bookSlugs.map((slug) => ({
      url: `${SITE_URL}/library/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...authors.map((author) => ({
      url: `${SITE_URL}/author/${author.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...plans
      .filter((plan) => plan.is_active)
      .map((plan) => ({
        url: `${SITE_URL}/subscribe/${plan.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ...cmsPages
      .filter((page) => page.status === "published")
      .map((page) => ({
        url: `${SITE_URL}/p/${page.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
  ];

  return entries;
}
