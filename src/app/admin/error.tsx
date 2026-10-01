"use client";

import Link from "next/link";

/** Dashboard error boundary — keeps a failed query from blanking the admin. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono">Dashboard error</p>
        <h1 className="mt-4 text-3xl">That view could not load.</h1>
      </div>

      <div className="card p-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          The query behind this screen failed. Retrying is safe — nothing was changed.
        </p>
        {error.digest ? <p className="label-mono mt-4">Reference: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary btn-sm">
            Try again
          </button>
          <Link href="/admin" className="btn btn-outline btn-sm">
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
