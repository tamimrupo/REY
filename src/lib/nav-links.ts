/**
 * The storefront navigation, in one place.
 *
 * Kept out of the components because both the header (a server component) and
 * the small-screen menu (a client component) render it — and plain data cannot
 * be exported across a "use client" boundary.
 */
export const navLinks = [
  { href: "/plans", label: "Plans" },
  { href: "/library", label: "Library" },
  { href: "/authors", label: "Authors" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/rare", label: "Rare & requests" },
  { href: "/about-us", label: "About" },
];
