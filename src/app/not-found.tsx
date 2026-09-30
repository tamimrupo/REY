import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold text-ink">That shelf is empty</h1>
      <p className="mt-3 max-w-md text-sm text-ink-soft">
        The page you were looking for has been moved, returned, or never existed. Try the library
        instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/library" className="btn btn-primary">
          Browse the library
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
