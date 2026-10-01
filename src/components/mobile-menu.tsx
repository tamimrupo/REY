"use client";

import { useEffect, useRef, useState } from "react";

import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/lib/nav-links";

const itemClass =
  "rounded-card px-3 py-2 text-sm text-ink-soft transition-colors duration-150 hover:bg-cream hover:text-ink aria-[current=page]:bg-cream aria-[current=page]:font-semibold aria-[current=page]:text-ink";

/**
 * The small-screen menu.
 *
 * A disclosure panel rather than a native `<details>`, so that it can close on
 * Escape, on a click outside, and on the choice itself — and so it arrives with
 * the same quick pop as every other panel in the app.
 */
export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // Focus goes back to the button that opened the menu — but never on mount.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="site-mobile-menu"
        className="btn btn-outline btn-sm"
      >
        Menu
        <span aria-hidden className="text-base leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open ? (
        <div
          id="site-mobile-menu"
          className="animate-pop absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-card border border-line bg-white p-2 shadow-xl"
        >
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="my-1 h-px bg-line" />
            <NavLink
              href={signedIn ? "/account" : "/login"}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              {signedIn ? "My account" : "Sign in"}
            </NavLink>
            <NavLink href="/plans" onClick={() => setOpen(false)} className="btn btn-primary m-1">
              Start a plan
            </NavLink>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
