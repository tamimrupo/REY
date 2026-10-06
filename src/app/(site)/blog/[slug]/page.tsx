import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { getPost, POSTS } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export async function generateMetadata(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <section className="border-b border-line bg-paper">
        <div className="container-page pb-10 pt-10">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
            <Link href="/blog" className="inline-block py-1.5 hover:text-ink">
              Blog
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span aria-current="page">{post.title}</span>
          </nav>

          <p className="label-mono mt-7">
            {post.date} · {post.readingMinutes} min read
          </p>
          <h1 className="mt-3 max-w-3xl">{post.title}</h1>
        </div>
      </section>

      <article className="container-page py-12">
        <div className="max-w-2xl space-y-10">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-ink">{section.heading}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="mt-4 leading-relaxed text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {post.related.length ? (
          <div className="mt-14 rounded-card border border-line bg-cream p-6">
            <p className="label-mono">Keep reading</p>
            <ul className="mt-4 space-y-2.5">
              {post.related.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink underline decoration-ink/30 hover:decoration-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/plans" className="btn btn-primary">
            Start a plan from ৳299/mo
          </Link>
          <Link href="/blog" className="btn btn-ghost">
            All articles
          </Link>
        </div>
      </article>
    </>
  );
}
