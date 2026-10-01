"use client";

import Link from "next/link";

/**
 * Storefront error boundary. Without one, a render failure dropped visitors on
 * Next's default screen with no way back.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page py-20">
      <div className="flex items-center gap-4">
        <span className="label-mono">Something broke</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <h1 className="mt-8">That page did not load.</h1>
      <p className="mt-5 max-w-lg leading-relaxed text-ink-soft">
        It is us, not you. Try once more — most of these are a dropped connection. If it keeps
        happening, the reference below is what we need to find it.
      </p>

      {error.digest ? <p className="label-mono mt-5">Reference: {error.digest}</p> : null}

      <div className="mt-9 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}
