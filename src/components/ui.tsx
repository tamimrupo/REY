import Link from "next/link";

import { humanize, statusTone } from "@/lib/format";
import { SETUP_HINT, supabaseConfigured } from "@/lib/env";

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`pill ${statusTone(status)}`}>{label ?? humanize(status)}</span>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: React.ReactNode;
}) {
  // Monochrome: severity is carried by contrast, not hue.
  // errors invert to black; warnings sit on a tinted panel; success gets a
  // strong black border; info stays soft.
  const tones = {
    info: "border-line bg-surface text-ink",
    success: "border-ink bg-white text-ink",
    warning: "border-ink bg-surface text-ink",
    error: "border-ink bg-ink text-paper",
  } as const;

  // A live region, so a message that arrives after an action is spoken rather
  // than only drawn. Errors interrupt; everything else waits its turn.
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`animate-fade-up rounded-card border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  // A ruled statement, not a dashed placeholder: the page says what is missing
  // in the same voice it says everything else — and no louder than a section
  // heading, so the hierarchy stays intact.
  return (
    <div className="border-t border-ink pt-6">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-outline mt-6">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Banner shown on screens that need a database connection. */
export function SetupNotice() {
  if (supabaseConfigured) return null;
  return (
    <Alert tone="warning">
      <p className="font-semibold">One-time setup needed</p>
      <p className="mt-1">{SETUP_HINT}</p>
    </Alert>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  index,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Catalogue number shown before the label, e.g. "02". */
  index?: string;
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
      {eyebrow || index ? (
        centered ? (
          <p className="label-mono">
            {index ? `${index} / ` : ""}
            {eyebrow}
          </p>
        ) : (
          <div className="section-rule">
            <span className="label-mono">
              {index ? `${index} / ` : ""}
              {eyebrow}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
        )
      ) : null}

      <h2 className="mt-6 text-3xl sm:text-4xl">{title}</h2>

      {description ? (
        <p className={`mt-4 text-base leading-relaxed text-ink-soft ${centered ? "" : "max-w-2xl"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  // A figure under a rule, the way a report sets one — not a card in a grid.
  // The rule is a hairline: on a dashboard of twelve figures, twelve ink rules
  // would shout as loudly as the page's own masthead.
  return (
    <div className="border-t border-ink pt-4">
      <p className="label-mono">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-ink">{value}</p>
      {hint ? <p className="mt-2 text-meta text-ink-muted">{hint}</p> : null}
    </div>
  );
}

const CURRENCY_MARKS = ["৳", "$", "€", "£", "¥"];

/**
 * Money with an optically sized currency mark.
 *
 * Neither Playfair Display nor Google's Inter ships the ৳ glyph, so the browser
 * substitutes a system font that draws it 67% taller than the digits beside it
 * (measured: 35px of ink against 21px at 36px type). 0.62em lands the mark at
 * 103% — the same optical height as the numerals.
 */
export function Money({ value, className = "" }: { value: string; className?: string }) {
  const mark = CURRENCY_MARKS.includes(value.trim().charAt(0)) ? value.trim().charAt(0) : "";
  const amount = mark ? value.trim().slice(1) : value;

  return (
    <span className={className}>
      {mark ? <span className="mr-[0.03em] text-[0.62em]">{mark}</span> : null}
      {amount}
    </span>
  );
}
