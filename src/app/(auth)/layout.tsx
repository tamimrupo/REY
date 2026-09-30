import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <Link href="/" className="font-display text-3xl font-semibold">
          REY
          <span className="ml-1 align-super text-xs font-sans font-semibold tracking-[0.2em] text-gold">
            BD
          </span>
        </Link>

        <div>
          <p className="eyebrow">Rent &amp; read</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight text-paper">
            Twelve books a year, no shelf required.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/70">
            Pick a plan, choose your titles, and swap them every month. Refundable deposit, four
            couriers, delivered across Bangladesh.
          </p>
        </div>

        <div className="flex gap-8 text-xs text-paper/60">
          <span>Dhaka, Bangladesh</span>
          <span>Est. 2026</span>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
