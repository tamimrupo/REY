/**
 * Account loading skeleton.
 *
 * The account layout — container, side navigation, heading — is already on
 * screen when this renders, so it only has to hold the shape of what replaces
 * it: ruled figures (not cards) and a panel under a rule.
 */
export default function AccountLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      <div className="flex items-center gap-4">
        <span className="skeleton block h-2.5 w-28" />
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-t border-line pt-4">
            <span className="skeleton block h-2.5 w-20" />
            <span className="skeleton mt-3 block h-7 w-16" />
            <span className="skeleton mt-2 block h-2.5 w-24" />
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-6">
        <span className="skeleton block h-3 w-1/3" />
        <span className="skeleton mt-4 block h-3 w-2/3" />
        <span className="skeleton mt-3 block h-3 w-1/2" />
      </div>
    </div>
  );
}
