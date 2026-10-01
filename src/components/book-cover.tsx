"use client";

import { useEffect, useRef } from "react";

/**
 * The cover shown when a book has no image — and when its image fails to load.
 *
 * A lot of covers are hot-linked from Open Library and Wikimedia, and those
 * hosts drop images. Rather than a broken-image icon, the placeholder sits
 * underneath the photo: a real cover covers it, a missing one reveals it.
 *
 * The failed image is hidden imperatively (the same trick as AvatarImage) so a
 * broken cover never triggers a re-render.
 */
export function BookCoverImage({
  url,
  title,
  author,
  label,
  className = "",
  size = "md",
  loading = "lazy",
}: {
  url: string | null | undefined;
  title: string;
  author?: string | null;
  /** Extra line for the placeholder — genre, language, anything useful. */
  label?: string | null;
  /** Wrapper classes: sizing and rounding live with the caller. */
  className?: string;
  /** "sm" is for table rows and basket lines, where only the mark fits. */
  size?: "sm" | "md" | "lg";
  loading?: "lazy" | "eager";
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const hideBrokenCover = () => {
    const img = imgRef.current;
    if (img) img.style.display = "none";
  };

  useEffect(() => {
    if (!url) return;
    const img = imgRef.current;
    // An image that failed before hydration never fires onError.
    if (img && img.complete && img.naturalWidth === 0) {
      img.style.display = "none";
    }
  }, [url]);

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <CoverPlaceholder title={title} author={author} label={label} size={size} />

      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={url}
          alt={title}
          width={400}
          height={600}
          loading={loading}
          onError={hideBrokenCover}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}

/** The house placeholder: faded wordmark, the title, and who wrote it. */
export function CoverPlaceholder({
  title,
  author,
  label,
  size = "md",
}: {
  title: string;
  author?: string | null;
  label?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (size === "sm") {
    return (
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-mist to-frost"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/rey-logo-black.svg"
          alt=""
          width={78}
          height={40}
          className="h-2.5 w-auto opacity-35"
        />
      </span>
    );
  }

  const large = size === "lg";

  return (
    <span
      aria-hidden
      className={`absolute inset-0 flex flex-col items-center justify-between gap-3 bg-gradient-to-b from-mist to-frost text-center ${
        large ? "px-5 py-6" : "px-2.5 py-3.5"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/rey-logo-black.svg"
        alt=""
        width={78}
        height={40}
        className={`w-auto opacity-40 ${large ? "h-5" : "h-3.5"}`}
      />

      <span
        className={`line-clamp-4 font-display font-semibold leading-snug text-ink ${
          large ? "text-lg" : "text-[0.78rem]"
        }`}
      >
        {title}
      </span>

      <span
        className={`w-full truncate uppercase tracking-[0.16em] text-ink-muted ${
          large ? "text-[0.7rem]" : "text-[0.55rem]"
        }`}
      >
        {author || label || "REY BD"}
      </span>
    </span>
  );
}
