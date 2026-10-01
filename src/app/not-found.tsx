import Link from "next/link";

/**
 * Last-resort 404, for paths that never reach the storefront group. It has no
 * header to fall back on, so it keeps one button and one quiet link rather than
 * two competing actions.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <div className="flex items-center gap-4">
        <span className="label-mono">404</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <h1 className="mt-8">That shelf is empty.</h1>
      <p className="mt-5 text-base leading-relaxed text-ink-soft">
        The page you were looking for has been moved, returned, or never existed.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/library" className="btn btn-primary">
          Browse the library
        </Link>
        <Link
          href="/"
          className="text-sm text-ink-soft underline decoration-ink/30 hover:decoration-ink"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
