import type { Metadata } from "next";

/**
 * Shared Open Graph defaults so every page emits `og:image` and `og:type`.
 *
 * Next.js shallow-merges metadata across route segments, so a page that sets
 * its own `openGraph` replaces the root layout's openGraph *entirely*. `og:title`
 * and `og:description` are re-inherited from the page's own title/description
 * (see `inheritFromMetadata` in Next's metadata resolver), but `images` and
 * `type` are not — so a page setting only `openGraph.url` drops the social
 * preview image and the `og:type` tag.
 *
 * Build every page's `openGraph` through this helper so the default hero image
 * and a type are always emitted, while still letting the page override `url`,
 * `title`, `description` and `images`.
 */

/** The default social-preview image (same hero used by the root layout). */
export const OG_IMAGE = "/hero/reader-1880.jpg";

type OpenGraphOptions = {
  url?: string;
  title?: string;
  description?: string;
  type?: "website" | "article";
  images?: { url: string; alt?: string }[];
};

export function openGraph(options: OpenGraphOptions): NonNullable<Metadata["openGraph"]> {
  return {
    type: options.type ?? "website",
    ...(options.url ? { url: options.url } : {}),
    ...(options.title ? { title: options.title } : {}),
    ...(options.description ? { description: options.description } : {}),
    images: options.images?.length ? options.images : [{ url: OG_IMAGE }],
  };
}
