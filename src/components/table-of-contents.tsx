"use client";

import { useEffect, useState } from "react";

/**
 * The sidebar contents list on policy pages, like the WordPress one: numbered
 * links that jump to each section, with the section you are reading highlighted
 * as you scroll.
 *
 * On a phone it sits above the text (a list you scroll past is no use), and from
 * `lg` up it becomes the sticky right-hand column.
 */
export function TableOfContents({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!headings.length) return;

    // "Current" is the last heading to have passed under the sticky header. This
    // is recomputed from real positions rather than trusting the observer's
    // entries, so jumping straight to a section highlights the right one.
    const HEADER_OFFSET = 112;

    const update = () => {
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - HEADER_OFFSET <= 0) current = heading;
        else break;
      }

      // The final section may never reach the header — the page runs out first.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = headings[headings.length - 1];

      setActiveId(current.id);
    };

    const observer = new IntersectionObserver(update, {
      rootMargin: `-${HEADER_OFFSET}px 0px -20% 0px`,
      threshold: 0,
    });

    for (const heading of headings) observer.observe(heading);
    update();

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-card border border-line bg-surface/60 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto"
    >
      <p className="label-mono">
        Table of Contents
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={`block border-l-2 py-1.5 pl-3 leading-snug transition ${
                  active
                    ? "border-ink font-medium text-ink"
                    : "border-line text-ink-muted hover:border-ink/40 hover:text-ink"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
