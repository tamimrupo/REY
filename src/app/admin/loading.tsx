/**
 * Dashboard loading skeleton: the sidebar belongs to the admin layout, so this
 * only stands in for the content area — heading, stat row, then a table.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      <div>
        <div className="h-8 w-56 animate-pulse rounded-sm bg-frost" />
        <div className="mt-3 h-3 w-80 animate-pulse rounded-sm bg-line" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-5">
            <div className="h-2.5 w-24 animate-pulse rounded-sm bg-line" />
            <div className="mt-3 h-7 w-20 animate-pulse rounded-sm bg-frost" />
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <div className="flex items-center gap-4 border-b border-line bg-surface px-4 py-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-2.5 w-24 animate-pulse rounded-sm bg-line" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
            {Array.from({ length: 4 }).map((_, col) => (
              <div
                key={col}
                className="h-3 w-24 animate-pulse rounded-sm bg-frost"
                style={{ width: col === 0 ? "30%" : "16%" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
