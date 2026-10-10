import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { POSTS } from "@/lib/blog";
import { openGraph } from "@/lib/open-graph";

export const metadata = {
  title: "The REY BD Blog",
  description:
    "Guides on reading more, borrowing instead of buying, and the best books to read in Bangladesh — from the REY BD book rental club.",
  alternates: { canonical: "/blog" },
  openGraph: openGraph({ url: "/blog" }),
};

export default function BlogIndexPage() {
  return (
    <div className="container-page py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <Link href="/" className="inline-block py-1.5 hover:text-ink">
          Home
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span aria-current="page">Blog</span>
      </nav>

      <div className="section-rule mt-7">
        <span className="label-mono">Guides</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="label-mono">
          {POSTS.length} article{POSTS.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1>Read more, spend less</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
          Notes on reading, borrowing and the books worth your time — from the REY BD book club.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-card border border-line bg-white p-6 shadow-paper transition hover:-translate-y-0.5"
          >
            <p className="label-mono">
              {post.date} · {post.readingMinutes} min read
            </p>
            <h2 className="mt-3 font-display text-lg font-semibold leading-snug text-ink group-hover:underline">
              {post.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{post.description}</p>
            <span aria-hidden className="mt-5 text-ink-muted">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
