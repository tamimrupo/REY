"use client";

import { useEffect, useRef } from "react";

import { initials } from "@/lib/format";

/**
 * An author image that degrades gracefully: if the URL is missing, or the image
 * fails to load (a typo in the dashboard, or a host that blocks hot-linking), the
 * initials show through instead of a broken-image icon.
 *
 * The initials layer always sits underneath the image. A failed image is hidden
 * imperatively, which covers both failure paths:
 *
 *   1. The image errors after hydration → React's onError.
 *   2. The image errors *before* hydration — a bad domain fails fast, and the
 *      error fires while the HTML is still parsing, so onError never runs. The
 *      mount check catches it: `complete && naturalWidth === 0` means "finished
 *      loading, but there are no pixels".
 *
 * Hiding via the DOM rather than React state keeps this out of the render cycle
 * (setting state inside an effect would trigger an extra render for no reason).
 */
export function AvatarImage({
  name,
  url,
  variant = "portrait",
}: {
  name: string;
  url?: string | null;
  variant?: "portrait" | "circle";
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const hideBrokenImage = () => {
    const img = imgRef.current;
    if (img) img.style.display = "none";
  };

  useEffect(() => {
    if (!url) return;
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      img.style.display = "none";
    }
  }, [url]);

  const isCircle = variant === "circle";

  return (
    <span
      className={`relative block overflow-hidden ${
        isCircle ? "h-12 w-12 shrink-0 rounded-full ring-1 ring-line" : "aspect-[4/5] w-full"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center ${
          isCircle
            ? "bg-ink text-sm font-semibold text-paper"
            : "bg-mist font-display text-4xl font-semibold text-ink-muted"
        }`}
      >
        {initials(name)}
      </span>

      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={url}
          alt=""
          width={400}
          height={500}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={hideBrokenImage}
        />
      ) : null}
    </span>
  );
}
