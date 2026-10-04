"use client";

import Link from "next/link";
import { useState } from "react";

import { Reveal } from "@/components/motion";
import { ReadingScene } from "@/components/reading-scene";

/**
 * How it works — a designed page rather than a CMS one.
 *
 * Four steps of the real rental lifecycle: pick, receive, read, swap. Everything
 * here is monochrome: the reference palette's sage and mint are carried by the
 * mist and frost bands, and its accent colour by ink.
 */

const steps = [
  {
    n: "01",
    title: "Pick a plan and your books",
    body: "Choose a monthly tier, then build a reading list from the catalogue — English and Bangla, from classics to this year's arrivals.",
    note: "2, 4 or 8 books a month",
    icon: "book",
  },
  {
    n: "02",
    title: "Delivered to your door",
    body: "We ride to you anywhere in Bangladesh. Patheo, Steadfast or RedX for ৳40 a trip, or free through Bangladesh Post's Book Post.",
    note: "Free with BD Post",
    icon: "door",
  },
  {
    n: "03",
    title: "Read at your own pace",
    body: "No due dates and no fines. Keep a book as long as you need it — we only ask for a fair replacement value if one is lost.",
    note: "No overdue fines",
    icon: "chair",
  },
  {
    n: "04",
    title: "Swap, don't shop",
    body: "When you are finished, request a swap. One trip: the rider takes the old books and leaves the new ones at the door.",
    note: "One trip, both ways",
    icon: "swap",
  },
] as const;

const tiers = [
  {
    key: "lite",
    name: "Lite reader",
    books: 2,
    price: "৳299",
    deposit: "৳500",
    perks: [
      "2 books a month, swapped when you are done",
      "Doorstep delivery and collection",
      "Full library access — 135 titles and growing",
      "Cancel or pause any month",
    ],
  },
  {
    key: "avid",
    name: "Avid reader",
    books: 4,
    price: "৳499",
    deposit: "৳500",
    perks: [
      "4 books a month, swapped when you are done",
      "Priority on new arrivals",
      "Doorstep delivery and collection",
      "Cancel or pause any month",
    ],
  },
] as const;

const questions = [
  {
    q: "What if a book gets damaged?",
    a: "Tell us and we will sort it out. Normal reading wear — a creased spine, a bumped corner — costs nothing. The ৳500 deposit is there for a book that is lost or ruined, and it is refunded when your plan ends.",
  },
  {
    q: "How does the swap work?",
    a: "Request a swap from your account when you are ready. One trip does both jobs: our rider collects the books you have finished and hands over the next ones. You can raise it any time inside your monthly cycle.",
  },
  {
    q: "Is delivery covered across Bangladesh?",
    a: "Dhaka and Chattogram are same or next day; everywhere else reaches the courier network within 2–4 days. Bangladesh Post carries book parcels free under its Book Post service, and you can check the package at the door.",
  },
  {
    q: "Can I keep a book for longer than a month?",
    a: "Yes. There are no due dates and no fines. Your plan governs how many books you may hold at once, not how long you hold them — most people settle into a book a week and swap accordingly.",
  },
];

function Icon({ name }: { name: (typeof steps)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
    "aria-hidden": true,
  };

  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
      </svg>
    );
  }
  if (name === "door") {
    return (
      <svg {...common}>
        <path d="M5 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
        <path d="M4 21h13" />
        <path d="M13 12h.01" />
        <path d="M19 21V12a3 3 0 0 0-3-3" />
      </svg>
    );
  }
  if (name === "chair") {
    return (
      <svg {...common}>
        <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
        <path d="M5 11h14a1 1 0 0 1 1 1v4H4v-4a1 1 0 0 1 1-1Z" />
        <path d="M7 19v-3M17 19v-3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 8h13l-3-3" />
      <path d="M20 16H7l3 3" />
    </svg>
  );
}

export function HowItWorks() {
  const [tier, setTier] = useState<(typeof tiers)[number]["key"]>("avid");
  const active = tiers.find((t) => t.key === tier) ?? tiers[1];

  return (
    <>
      {/* ------------------------------------------------------------- Opening */}
      <section className="border-b border-line bg-cream">
        <div className="container-page py-20 text-center">
          <p className="eyebrow">How it works</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-ink">
            Unlimited reading, <em className="italic">zero shelf clutter.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            How Rey Book Rental Services brings your favourite books straight to your doorstep.
          </p>

          <Reveal className="mx-auto mt-12 max-w-4xl rounded-3xl border border-line bg-white p-8 shadow-paper sm:p-12">
            <ReadingScene className="mx-auto h-32 w-full max-w-xl text-ink sm:h-40" />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-line pt-6">
              {["Pick", "Receive", "Read", "Swap"].map((label, index) => (
                <span key={label} className="flex items-center gap-3">
                  {index > 0 ? <span aria-hidden className="h-px w-6 bg-line" /> : null}
                  <span className="label-mono">{label}</span>
                </span>
              ))}
            </div>
          </Reveal>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/plans" className="btn btn-primary">
              See the plans
            </Link>
            <Link href="/library" className="btn btn-outline">
              Browse the library
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Four steps */}
      <section className="container-page py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal
              key={step.n}
              delay={index * 90}
              className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink font-display text-base font-bold text-ink">
                  {step.n}
                </span>
                <span className="text-ink-muted">
                  <Icon name={step.icon} />
                </span>
              </div>
              <h2 className="mt-5 text-xl">{step.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">{step.body}</p>
              <p className="label-mono mt-auto pt-6">{step.note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Simulator */}
      <section className="border-y border-line bg-mist">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow">What you pay</p>
            <h2 className="mt-4 max-w-md">
              Two books, <em className="italic">or four.</em>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              Slide between the tiers to see what lands at your door each month. The ৳500 security
              deposit is charged once, refunded when you stop.
            </p>

            <div
              role="tablist"
              aria-label="Reading tier"
              className="mt-8 inline-flex rounded-full border border-line bg-white p-1"
            >
              {tiers.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={tier === option.key}
                  onClick={() => setTier(option.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                    tier === option.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal className="rounded-2xl border border-line bg-white p-6 shadow-paper sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="label-mono">{active.name}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight text-ink">
                    {active.price}
                  </span>
                  <span className="text-sm text-ink-muted">/month</span>
                </p>
              </div>
              <p className="text-right text-sm text-ink-soft">
                {active.books} books a month
                <span className="mt-1 block text-meta text-ink-muted">
                  Deposit {active.deposit} · refundable
                </span>
              </p>
            </div>

            <ul className="mt-7 divide-y divide-line border-y border-line text-sm text-ink-soft">
              {active.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 py-3">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href={`/plans`} className="btn btn-primary">
                Choose {active.name.toLowerCase()}
              </Link>
              <span className="text-sm text-ink-muted">Swap or cancel any month</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Before you join</p>
            <h2 className="mt-4 max-w-sm">
              The questions people <em className="italic">actually ask.</em>
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-soft">
              Anything else, and you can reach us on WhatsApp or at hello@reybd.com.
            </p>
          </div>

          <div className="border-t border-line">
            {questions.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-5">
                  <span className="font-display text-lg font-bold text-ink">{item.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-base leading-relaxed text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Closing */}
      <section className="border-t border-line bg-cream">
        <div className="container-page py-20">
          <Reveal className="mx-auto max-w-2xl rounded-3xl border border-line bg-white px-8 py-14 text-center shadow-paper">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mt-4">Ready to start your reading journey?</h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
              Join the club and your first box can be on the way this week.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/plans" className="btn btn-primary">
                Choose a plan
              </Link>
              <Link href="/rare" className="btn btn-outline">
                Request a rare book
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
