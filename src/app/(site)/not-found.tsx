import Link from "next/link";

/**
 * Storefront 404.
 *
 * It lives inside the `(site)` group so a wrong URL still lands inside the
 * product — header, footer, and one clear way onward. A dead end with two
 * competing buttons is the worst kind of error page.
 */
export default function SiteNotFound() {
  return (
    <div className="container-page py-20">
      <div className="flex items-center gap-4">
        <span className="label-mono">404</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <h1 className="mt-8 max-w-2xl">That shelf is empty.</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
        The page you were looking for has been moved, returned, or never existed.
      </p>

      <Link href="/library" className="btn btn-primary mt-8">
        Browse the library
      </Link>
    </div>
  );
}
