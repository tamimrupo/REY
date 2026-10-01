import Link from "next/link";

import { TableOfContents } from "@/components/table-of-contents";
import { slugify } from "@/lib/format";
import type { CmsPage } from "@/lib/types";

type Node =
  | { kind: "heading"; id: string; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "steps"; items: string[] };

const BULLET = /^[-•]\s+/;
const STEP = /^\d+\.\s+\S/;

/**
 * Renders a CMS page.
 *
 * Content is plain text. A line starting with "## " is a section heading; lines
 * starting with "- " become bullets and "1. " becomes a numbered step. Any page
 * with two or more headings gets a "Table of Contents" column beside the text.
 */
export function CmsArticle({
  page,
  children,
}: {
  page: CmsPage;
  children?: React.ReactNode;
}) {
  const raw = (page.content ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  // The stored text usually opens by repeating the title. The <h1> already says
  // it, so drop that line — whether it is the whole block or the first of many.
  const body = [...raw];
  if (body[0]) {
    const [firstLine, ...rest] = body[0].split("\n");
    if (firstLine.trim().toLowerCase() === page.title.toLowerCase()) {
      if (rest.join("\n").trim()) body[0] = rest.join("\n");
      else body.shift();
    }
  }

  const used = new Set<string>();
  const nodes: Node[] = [];

  for (const block of body) {
    if (block.startsWith("## ")) {
      const text = block.slice(3).trim();
      const base = slugify(text) || "section";
      let id = base;
      let attempt = 2;
      while (used.has(id)) {
        id = `${base}-${attempt}`;
        attempt += 1;
      }
      used.add(id);
      nodes.push({ kind: "heading", id, text });
      continue;
    }

    // Group the lines: prose stays prose, dashes become bullets, "1." becomes a
    // numbered step — so the output reads like a document, not a text file.
    let pending: string[] = [];
    let bullets: string[] = [];
    let steps: string[] = [];

    const flushProse = () => {
      if (pending.length) {
        nodes.push({ kind: "paragraph", text: pending.join("\n").trim() });
        pending = [];
      }
    };
    const flushBullets = () => {
      if (bullets.length) {
        nodes.push({ kind: "bullets", items: bullets });
        bullets = [];
      }
    };
    const flushSteps = () => {
      if (steps.length) {
        nodes.push({ kind: "steps", items: steps });
        steps = [];
      }
    };

    for (const line of block.split("\n")) {
      const value = line.trim();
      if (!value) continue;

      if (BULLET.test(value)) {
        flushProse();
        flushSteps();
        bullets.push(value.replace(BULLET, "").trim());
        continue;
      }

      if (STEP.test(value)) {
        flushProse();
        flushBullets();
        steps.push(value.trim());
        continue;
      }

      flushBullets();
      flushSteps();
      pending.push(value);
    }

    flushProse();
    flushBullets();
    flushSteps();
  }

  const contents = nodes
    .filter((node): node is Extract<Node, { kind: "heading" }> => node.kind === "heading")
    .map((node) => ({ id: node.id, label: node.text }));

  return (
    <div className="container-page py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        {contents.length >= 2 ? (
          <aside className="order-first lg:order-none lg:col-start-2 lg:row-start-1 lg:self-start">
            <TableOfContents items={contents} />
          </aside>
        ) : null}

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p className="eyebrow">REY BD</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink">{page.title}</h1>
          {page.excerpt ? (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{page.excerpt}</p>
          ) : null}

          <div className="mt-10 max-w-3xl space-y-5 text-body leading-relaxed text-ink-soft">
            {nodes.map((node, index) => {
              if (node.kind === "heading") {
                return (
                  <h2
                    key={index}
                    id={node.id}
                    className="scroll-mt-24 pt-4 font-display text-lg font-semibold leading-snug text-ink"
                  >
                    {node.text}
                  </h2>
                );
              }

              if (node.kind === "bullets") {
                return (
                  <ul key={index} className="list-disc space-y-2 pl-5 marker:text-ink/40">
                    {node.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                );
              }

              if (node.kind === "steps") {
                return (
                  <ol key={index} className="list-decimal space-y-2 pl-5 marker:text-ink/40">
                    {node.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ol>
                );
              }

              return (
                <p className="whitespace-pre-line" key={index}>
                  {node.text}
                </p>
              );
            })}
          </div>

          {children}

          <div className="mt-14 flex max-w-3xl flex-wrap gap-3 border-t border-line pt-8">
            <Link href="/plans" className="btn btn-primary btn-sm">
              See the plans
            </Link>
            <Link href="/contact" className="btn btn-outline btn-sm">
              Talk to us
            </Link>
          </div>
        </div>
      </div>
    </div>
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
