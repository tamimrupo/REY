"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The story timeline.
 *
 * Each dot fills in as its row comes up the screen and stays filled, so the rail
 * reads as progress rather than five static markers: by the time you reach the
 * last stage, all five are ink. Motion only on the dot and its label, so nothing
 * moves that you would have to read.
 *
 * If the observer is missing, or motion is off, every dot is filled — the
 * timeline is never half-drawn.
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
