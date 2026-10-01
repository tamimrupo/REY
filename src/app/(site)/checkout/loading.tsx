/**
 * Checkout loading skeleton.
 *
 * The checkout page brings its own container, so this mirrors it: a summary on
 * one side, the payment panel on the other — the same two columns the real page
 * settles into, so nothing jumps when it arrives.
 */
export default function CheckoutLoading() {
  return (
    <div className="container-page py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      <div className="flex items-center gap-4">
        <span className="skeleton block h-2.5 w-32" />
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <span className="skeleton mt-8 block h-9 w-1/2 max-w-sm" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6">
          <span className="skeleton block h-3 w-24" />
          <span className="skeleton mt-5 block h-11 w-full" />
          <span className="skeleton mt-4 block h-11 w-full" />
          <span className="skeleton mt-6 block h-32 w-full" />
        </div>
        <div className="card p-6">
          <span className="skeleton block h-3 w-24" />
          <span className="skeleton mt-5 block h-3 w-2/3" />
          <span className="skeleton mt-3 block h-3 w-1/2" />
          <span className="skeleton mt-6 block h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
