import type { MetadataRoute } from "next";

import { POSTS } from "@/lib/blog";
import { getAuthorsWithCounts, getCmsPages, getGenres, getPlans, listBooks } from "@/lib/data";
import { SITE_URL } from "@/lib/site-url";

// The catalogue changes during the day; an hourly refresh keeps new books,
// authors and posts discoverable without waiting for the next deploy. Without
// this the sitemap is a build-time snapshot — and can even be served from a
// previous build's cache, as it just was.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [authors, cmsPages, genres, plans] = await Promise.all([
    // Only authors with titles: a zero-book author would be an orphan URL.
    getAuthorsWithCounts(),
    getCmsPages(),
    getGenres(),
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

  // CMS pages whose /p/… URL 301s to a top-level static page (see the
  // `redirects()` list in next.config.ts). Their /p/… address is never the
  // canonical one, so keep it out of the sitemap — Ahrefs flags "3xx redirect
  // in sitemap" otherwise.
  const REDIRECTED_CMS_SLUGS = new Set(["about-us", "how-it-works"]);

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/plans", priority: 0.9 },
    { path: "/library", priority: 0.9 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/book-rental-dhaka", priority: 0.8 },
    { path: "/genres", priority: 0.7 },
    { path: "/blog", priority: 0.6 },
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
    ...genres
      .filter((genre) => genre.sort_order > 0)
      .map((genre) => ({
        url: `${SITE_URL}/genre/${genre.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...authors.map(({ author }) => ({
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
      .filter((page) => page.status === "published" && !REDIRECTED_CMS_SLUGS.has(page.slug))
      .map((page) => ({
        url: `${SITE_URL}/p/${page.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    ...POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
