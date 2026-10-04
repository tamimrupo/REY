import Link from "next/link";

import { Reveal } from "@/components/motion";
import { ReadingScene } from "@/components/reading-scene";

export const metadata = {
  title: "About us",
  description:
    "Rey Book Rental Services is a home-delivery book subscription for Bangladesh: pick your titles, read at your own pace, and swap them at the door.",
};

/** The story, told as milestones rather than invented dates. */
const milestones = [
  {
    n: "01",
    title: "The gap",
    body: "Public libraries sit in a handful of cities and close when you finish work. Buying every book you want to read fills a room and empties a wallet. For most readers in Bangladesh, neither is a real option.",
  },
  {
    n: "02",
    title: "The first shelf",
    body: "We started with one shelf and one rule: a book nobody is reading is a book doing nothing. So we began lending ours out, and asked readers what they wanted next.",
  },
  {
    n: "03",
    title: "Doors, not counters",
    body: "A subscription with couriers behind it, so the library comes to you. Pick two, four or eight titles a month; we bring them, and we take back the ones you have finished.",
  },
  {
    n: "04",
    title: "A circle, not a pile",
    body: "Every swap sends books onward to the next reader instead of onto a shelf. That is the whole idea: a library that fits through a doorway and keeps moving.",
  },
];

const pillars = [
  {
    title: "Books that keep moving",
    body: "A title that has been out with five readers has done more good than five copies sitting in one home.",
    icon: "recycle",
  },
  {
    title: "Delivered to the door",
    body: "Four couriers, nationwide. Free through Bangladesh Post's Book Post service, and you can check the parcel on arrival.",
    icon: "door",
  },
  {
    title: "No late fees, ever",
    body: "No due dates and no fines. Read at the pace life allows — the deposit is for lost books, not for slow ones.",
    icon: "clock",
  },
  {
    title: "English and Bangla",
    body: "Classics, translations, contemporary fiction and rare requests. If it is not on our shelf, tell us and we will look for it.",
    icon: "map",
  },
] as const;

function PillarIcon({ name }: { name: (typeof pillars)[number]["icon"] }) {
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
  if (name === "recycle") {
    return (
      <svg {...common}>
        <path d="M7 19H4.5a2 2 0 0 1-1.7-3l2.2-3.6" />
        <path d="M11 5.2 9.6 3.9A2 2 0 0 0 6.6 5l-1 4" />
        <path d="M17 19h2.5a2 2 0 0 0 1.7-3L17 9" />
        <path d="M8 19l3 3M8 19l3-3" />
      </svg>
    );
  }
  if (name === "door") {
    return (
      <svg {...common}>
        <path d="M5 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
        <path d="M4 21h14M13 12h.01" />
        <path d="M19 21V12a3 3 0 0 0-3-3" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 2" />
        <path d="M4 5 6.5 3M20 5l-2.5-2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** The people behind the shelf, drawn the way the rest of the page is. */
function CommunityScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Readers, a courier and a curator standing together"
      className={className}
    >
      {/* curator, holding a list */}
      <circle cx="52" cy="38" r="11" />
      <path d="M40 34c2-8 9-12 16-10" />
      <path d="M39 52c-6 4-9 11-9 19v20h36V71c0-8-3-15-9-19" />
      <path d="M46 74h18v22H46z" />
      <path d="M50 80h10M50 86h10" />

      {/* courier with a parcel */}
      <circle cx="140" cy="42" r="11" />
      <path d="M128 38c3-8 10-12 17-9" />
      <path d="M127 56c-5 4-8 10-8 18v17h34V74c0-8-3-14-8-18" />
      <path d="M150 70h18v16h-18z" />
      <path d="M150 78h18M159 70v16" />

      {/* reader, mid-page */}
      <circle cx="226" cy="40" r="11" />
      <path d="M214 36c2-8 9-12 16-10" />
      <path d="M213 54c-6 4-9 11-9 19v18h36V73c0-8-3-15-9-19" />
      <path d="M217 74h20l8 9-8 9h-20l-8-9 8-9Z" />
      <path d="M227 74v18" />

      {/* books between them */}
      <path d="M84 62h22v16H84z" />
      <path d="M90 68h10M90 73h7" />
      <path d="M254 60h22v16h-22z" />
      <path d="M258 66h14M258 71h9" />

      <path d="M22 122h276" strokeDasharray="2 8" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* ------------------------------------------------------------- Opening */}
      <section className="border-b border-line bg-cream">
        <div className="container-page py-20 text-center">
          <p className="eyebrow">About Rey</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-ink">
            Redefining how <em className="italic">Bangladesh reads.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            We are building a sustainable, community-driven home delivery library that fits
            seamlessly into modern life.
          </p>

          <Reveal className="mx-auto mt-12 max-w-4xl rounded-3xl border border-line bg-white p-8 shadow-paper sm:p-12">
            <ReadingScene className="mx-auto h-32 w-full max-w-xl text-ink sm:h-40" />
            <p className="mx-auto mt-8 max-w-2xl border-t border-line pt-6 text-base leading-relaxed text-ink-soft">
              Books belong in hands, not on shelves. Rey is a rental club: you choose what to read,
              we deliver it, and when you are finished it moves on to the next reader.
            </p>
          </Reveal>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/library" className="btn btn-primary">
              Browse the library
            </Link>
            <Link href="/plans" className="btn btn-outline">
              See the plans
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Mission and vision */}
      <section className="container-page py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="flex h-full flex-col rounded-3xl border border-line bg-mist p-8 sm:p-10">
            <p className="label-mono">Our mission</p>
            <h2 className="mt-4 max-w-md">
              Literature in every household, <em className="italic">without the clutter.</em>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              To make books accessible to any home in Bangladesh — without filling a room with them
              or straining a monthly budget. A subscription should cost less than two new
              paperbacks and still keep your table full.
            </p>
          </Reveal>

          <Reveal
            delay={120}
            className="flex h-full flex-col rounded-3xl border border-line bg-white p-8 shadow-card sm:p-10"
          >
            <p className="label-mono">Our vision</p>
            <h2 className="mt-4 max-w-md">
              A circular reading economy, <em className="italic">nationwide.</em>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              A country where a book is read by many hands before it rests: shared, cared for and
              passed along. Every swap we make is one more turn of that circle, and one less book
              printed to sit unread.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Story */}
      <section className="border-y border-line bg-mist">
        <div className="container-page py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Why we started</p>
            <h2 className="mt-4">
              A library that fits <em className="italic">through a doorway.</em>
            </h2>
          </div>

          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {milestones.map((milestone, index) => (
              <Reveal key={milestone.n} delay={index * 100} className="border-t border-ink pt-5">
                <span className="label-mono">{milestone.n}</span>
                <h3 className="mt-3 text-xl">{milestone.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink-soft">{milestone.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pillars */}
      <section className="container-page py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delay={index * 90}
              className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card"
            >
              <span className="text-ink">
                <PillarIcon name={pillar.icon} />
              </span>
              <h3 className="mt-5 text-xl">{pillar.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">{pillar.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- Community */}
      <section className="border-y border-line bg-cream">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal className="rounded-3xl border border-line bg-white p-8 shadow-paper sm:p-12">
            <CommunityScene className="h-28 w-full text-ink sm:h-32" />
          </Reveal>

          <div>
            <p className="eyebrow">The people behind it</p>
            <h2 className="mt-4 max-w-md">
              Curators, couriers and <em className="italic">readers.</em>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              Someone reads every title before it joins the shelf, and someone rides it to your
              door. The rest of the club is its members: the authors you have told us about, the
              rare requests you have sent, and every book that has come back to be lent again.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/authors" className="btn btn-outline">
                Meet the authors
              </Link>
              <Link
                href="/rare"
                className="text-sm text-ink-soft underline decoration-ink/30 hover:decoration-ink"
              >
                Request a title we do not have
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Closing */}
      <section className="container-page py-20">
        <Reveal className="mx-auto max-w-2xl rounded-3xl border border-line bg-mist px-8 py-14 text-center shadow-paper">
          <p className="eyebrow">Join us</p>
          <h2 className="mt-4">Join the Rey reading movement today.</h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
            Your first box can be on its way this week — delivered to the door, and collected from
            it when you are done.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/library" className="btn btn-primary">
              Browse catalog
            </Link>
            <Link href="/plans" className="btn btn-outline">
              View rental plans
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
