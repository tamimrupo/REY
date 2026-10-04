"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The story timeline.
 *
 * Scrolling lights it up, in both directions: a row paints its own segment of
 * the rail in ink and fills its dot while it sits above the reading line, and
 * gives both back when you scroll up past it. The line is the progress.
 *
 * The fill is drawn per row rather than measured, so there is nothing to
 * recalculate on resize and nothing to get wrong when the copy changes length.
 * Only colour and opacity animate; no element moves that you would have to read.
 * The scroll listener is passive and does its arithmetic once a frame.
 */
export function Timeline({
  items,
}: {
  items: { stage: string; title: string; body: string }[];
}) {
  const [reached, setReached] = useState<boolean[]>(() => items.map(() => false));
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // A row is lit while its top is above the reading line, so the timeline
    // follows the scroll in both directions: stage by stage as you come down,
    // and back to where you are as you go up. The line sits a third of the way
    // down the viewport - high enough that a stage lights when you reach it,
    // low enough that the last one is lit before the section leaves the screen.
    const update = () => {
      const line = window.innerHeight * 0.35;
      const next = rows.current.map((row) => (row ? row.getBoundingClientRect().top <= line : false));
      setReached((previous) => (previous.every((value, i) => value === next[i]) ? previous : next));
    };

    let frame = 0;
    const tick = () => {
      frame = 0;
      update();
    };

    frame = requestAnimationFrame(tick);
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

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
