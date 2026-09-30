import Link from "next/link";

import type { CmsPage } from "@/lib/types";

export function CmsArticle({
  page,
  children,
}: {
  page: CmsPage;
  children?: React.ReactNode;
}) {
  const paragraphs = (page.content ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="container-page max-w-3xl py-16">
      <p className="eyebrow">REY BD</p>
      <h1 className="mt-3 text-4xl font-semibold text-ink">{page.title}</h1>
      {page.excerpt ? (
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{page.excerpt}</p>
      ) : null}

      <div className="mt-10 space-y-5 text-[0.95rem] leading-relaxed text-ink-soft">
        {paragraphs.map((block, index) => (
          <p className="whitespace-pre-line" key={index}>
            {block}
          </p>
        ))}
      </div>

      {children}

      <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-8">
        <Link href="/plans" className="btn btn-primary btn-sm">
          See the plans
        </Link>
        <Link href="/contact" className="btn btn-outline btn-sm">
          Talk to us
        </Link>
      </div>
    </article>
  );
}

export function MissingPage({ slug }: { slug: string }) {
  return (
    <div className="container-page max-w-2xl py-24 text-center">
      <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-3 text-sm text-ink-muted">
        We could not find a page at <code className="rounded bg-cream px-1.5 py-0.5">/{slug}</code>.
        It may still be a draft in the dashboard.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back home
      </Link>
    </div>
  );
}
