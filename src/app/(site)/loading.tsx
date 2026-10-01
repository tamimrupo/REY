/**
 * Storefront loading skeleton.
 *
 * Rendered inside the site layout, so the header and footer stay put while a
 * page streams in. Shapes mirror the real content (masthead rule, big title,
 * grid of covers) rather than a generic spinner.
 */
export default function SiteLoading() {
  const cards = Array.from({ length: 6 });

  return (
    <div className="container-page py-16" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      {/* Masthead: mono label — rule — count */}
      <div className="flex items-center gap-4">
        <span className="h-2.5 w-36 animate-pulse rounded-field bg-frost" />
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="h-2.5 w-20 animate-pulse rounded-field bg-frost" />
      </div>

      <div className="mt-8 h-10 w-2/3 max-w-lg animate-pulse rounded-field bg-frost" />
      <div className="mt-5 h-3 w-1/2 max-w-md animate-pulse rounded-field bg-line" />

      <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {cards.map((_, index) => (
          <div key={index}>
            <div className="aspect-[2/3] w-full animate-pulse rounded-card border border-line bg-frost" />
            <div className="mt-3 h-3 w-4/5 animate-pulse rounded-field bg-line" />
            <div className="mt-2 h-2.5 w-2/5 animate-pulse rounded-field bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
