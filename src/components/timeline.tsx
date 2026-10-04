"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The story timeline.
 *
 * Scrolling lights it up: each row paints its own segment of the rail in ink and
 * fills its dot as it reaches the top third of the screen, and both stay lit. By
 * the last stage the line is solid — the reading progress the section is about.
 *
 * The fill is drawn per row rather than measured, so there is nothing to
 * recalculate on resize and nothing to get wrong when the copy changes length.
 * Only colour and opacity animate; no element moves that you would have to read.
 * Without an observer the dots stay hollow and the rail stays light rather than
 * half-drawn.
 */
export function Timeline({
  items,
}: {
  items: { stage: string; title: string; body: string }[];
}) {
  const [reached, setReached] = useState<boolean[]>(() => items.map(() => false));
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = rows.current.indexOf(entry.target as HTMLLIElement);
          if (index < 0) continue;
          setReached((previous) =>
            previous[index] ? previous : previous.map((value, i) => (i <= index ? true : value)),
          );
        }
      },
      { rootMargin: "0px 0px -72% 0px", threshold: 0 },
    );

    for (const row of rows.current) if (row) observer.observe(row);
    return () => observer.disconnect();
  }, [items]);

  return (
    <ol className="mt-14 border-l-2 border-line pl-8 sm:pl-12">
      {items.map((item, index) => (
        <li
          key={item.stage}
          ref={(node) => {
            rows.current[index] = node;
          }}
          className="relative grid gap-2 pb-10 last:pb-0 sm:grid-cols-[8.5rem_1fr] sm:gap-10"
        >
          {/* This row's share of the rail, painted over the hairline when reached. */}
          <span
            aria-hidden
            className={`absolute -left-[2.125rem] top-0 h-full w-0.5 bg-ink transition-opacity duration-700 sm:-left-[3.125rem] ${
              reached[index] ? "opacity-100" : "opacity-0"
            }`}
          />

          <span
            aria-hidden
            className={`absolute -left-[2.35rem] top-2 h-3 w-3 rounded-full border-2 border-ink transition-colors duration-500 sm:-left-[3.35rem] ${
              reached[index] ? "bg-ink" : "bg-mist"
            }`}
          />

          <p
            className={`label-mono transition-colors duration-500 sm:pt-1.5 ${
              reached[index] ? "text-ink" : ""
            }`}
          >
            {item.stage}
          </p>

          <div>
            <h3 className="text-2xl">{item.title}</h3>
            <p className="mt-2.5 max-w-xl text-base leading-[1.75] text-ink-soft">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
