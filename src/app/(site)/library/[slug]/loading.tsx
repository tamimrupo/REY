/**
 * Book detail skeleton.
 *
 * Mirrors the real page: breadcrumb, cover beside a title block, the spec
 * ledger, the primary actions, then the author block. Shapes are the point —
 * when the title and cover arrive they land where the reader was already
 * looking.
 */
export default function BookLoading() {
  return (
    <div className="container-page py-10" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="skeleton block h-2.5 w-14" />
        <span className="skeleton block h-2.5 w-20" />
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[380px_1fr]">
        {/* Cover */}
        <div className="skeleton aspect-[2/3] w-full rounded-card" />

        {/* Title block, flags, ledger, actions */}
        <div>
          <div className="flex gap-2">
            <span className="skeleton block h-5 w-24" />
            <span className="skeleton block h-5 w-16" />
          </div>

          <span className="skeleton mt-5 block h-12 w-4/5" />
          <span className="skeleton mt-3 block h-12 w-3/5" />
          <span className="skeleton mt-5 block h-3 w-40" />

          <div className="mt-8 space-y-0">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between border-b border-line py-3">
                <span className="skeleton block h-2.5 w-20" />
                <span className="skeleton block h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="skeleton block h-11 w-48" />
            <span className="skeleton block h-11 w-40" />
          </div>
        </div>
      </div>

      {/* Author block */}
      <div className="mt-14 border-t border-ink pt-7">
        <div className="grid gap-8 sm:grid-cols-[164px_1fr] sm:gap-10">
          <div className="skeleton aspect-square w-32 rounded-card sm:w-full" />
          <div>
            <span className="skeleton block h-2.5 w-16" />
            <span className="skeleton mt-3 block h-7 w-52" />
            <span className="skeleton mt-4 block h-3 w-full max-w-xl" />
            <span className="skeleton mt-2 block h-3 w-2/3 max-w-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
