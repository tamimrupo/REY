"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Small, restrained motion helpers.
 *
 * Rules of the house: nothing moves unless it helps, and nothing moves at all
 * for someone who has asked their system for reduced motion. Movement is a
 * transition on opacity/transform only, so it never triggers layout.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fades a block up as it enters the viewport.
 *
 * Nothing is hidden in the markup. On mount, blocks already on screen are left
 * alone, and only blocks *below* the fold are "armed" (hidden) ready to reveal —
 * so a page whose script fails is simply visible rather than blank.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger, in milliseconds, for lists of siblings. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (onScreen) {
      // Already in front of the reader: show it, and do not make it jump.
      node.dataset.shown = "true";
      return;
    }

    node.dataset.armed = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Counts a number up when it scrolls into view: "৳500" counts 0 → 500 with the
 * currency mark held still. Values that are not a single number (like "1–4")
 * are left alone rather than mangled.
 */
export function CountUp({
  value,
  duration = 900,
  className = "",
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const match = /^([^\d]*)(\d+)([^\d]*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const target = match ? Number(match[2]) : null;
  const suffix = match?.[3] ?? "";

  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(target ?? 0);

  useEffect(() => {
    const node = ref.current;
    if (!node || target === null) return;

    const finish = () => setShown(target);

    // Years and other large numbers read better left alone, and reduced-motion
    // users get the answer immediately — deferred a frame so this never becomes
    // a cascading render.
    if (prefersReducedMotion() || target > 9999 || typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(finish, 0);
      return () => window.clearTimeout(id);
    }

    let frame = 0;
    let backstop = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        // A hidden tab never paints — and throttles frames to nothing — so show
        // the real number rather than a half-counted one.
        if (document.visibilityState === "hidden") {
          finish();
          return;
        }

        setShown(0);
        const started = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / duration);
          // Ease-out cubic: quick off the mark, settles gently.
          setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        // Belt and braces: however the frame loop behaves, end on the truth.
        backstop = window.setTimeout(finish, duration + 200);
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (backstop) window.clearTimeout(backstop);
    };
  }, [target, duration]);

  if (target === null) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

/**
 * Mirrors the scroll position onto the site header as `data-scrolled`, so the
 * sticky bar can lift onto a shadow once the page moves. The header itself stays
 * a server component; this only annotates it.
 */
export function ScrollElevation() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      header.dataset.scrolled = window.scrollY > 6 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/** Appears once the reader is a screen or so down, and returns them to the top. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      frame = 0;
      setVisible(window.scrollY > 700);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-paper transition-all duration-200 hover:-translate-y-0.5 hover:border-ink ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M12 19V6M12 6l-6 6M12 6l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
