import Link from "next/link";

import { Timeline } from "@/components/timeline";

import { Reveal } from "@/components/motion";
import { BookCoverImage } from "@/components/book-cover";
import { getShelfBooks } from "@/lib/data";

export const metadata = {
  title: "About us",
  description:
    "Rey Book Rental Services is a home-delivery book subscription for Bangladesh: books meant to travel, not to sit on a shelf.",
};

/** A reader in a window nook, drawn in the page's own ink. */
function WindowNook() {
  return (
    <svg
      viewBox="0 0 300 360"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Someone reading in a window nook with a cup of tea"
      className="h-full w-full"
    >
      {/* window frame and sill */}
      <path d="M28 26h244v240H28z" />
      <path d="M150 26v240M28 146h244" />
      <path d="M16 266h268v14H16z" />
      {/* curtain */}
      <path d="M40 26c10 40 10 160 0 240" strokeDasharray="5 7" />
      <path d="M260 26c-10 40-10 160 0 240" strokeDasharray="5 7" />
      {/* plant on the sill */}
      <path d="M198 266v-22h22v22" />
      <path d="M209 244c-4-14 2-24 10-28-2 12-4 20-10 28Z" />
      <path d="M209 244c-10-8-12-18-10-26 8 8 12 16 10 26Z" />
      {/* the reader, side on, knees up */}
      <circle cx="126" cy="150" r="20" />
      <path d="M104 142c4-14 16-22 30-18" />
      <path d="M96 190c-12 8-18 22-18 38v38h96v-38c0-16-6-30-18-38" />
      <path d="M78 266v-14h60v14" />
      <path d="M138 210h34v26h-34z" />
      <path d="M138 223h34" />
      {/* tea on the sill */}
      <path d="M60 266v-16h24v16" />
      <path d="M84 252c8 0 12 4 12 8s-4 8-12 8" />
      <path d="M66 240c2-6 6-6 8 0" strokeDasharray="3 5" />
      {/* floor */}
      <path d="M16 320h268" strokeDasharray="2 8" />
    </svg>
  );
}

/** The signature, set in a script face. */
function Signature() {
  return <span className="font-script text-6xl font-semibold leading-none text-ink">Rey</span>;
}

const milestones = [
  {
    stage: "The idea",
    title: "A shelf doing nothing",
    body: "It started with books nobody was reading. Lending them out felt more useful than keeping them, and one question followed: what if that was the whole model?",
  },
  {
    stage: "The first box",
    title: "From one flat to another",
    body: "The first deliveries went out by hand. Readers picked two titles, we carried them over, and the empty-handed swap at the door became the shape of everything since.",
  },
  {
    stage: "Subscriptions",
    title: "Plans instead of purchases",
    body: "A monthly tier — two, four or eight books — with a refundable deposit and no due dates. Buying a book became borrowing one, and reading stopped being a storage problem.",
  },
  {
    stage: "Nationwide",
    title: "Beyond the two cities",
    body: "Four couriers and Bangladesh Post's Book Post service now reach the districts, so a reader in Sylhet or Khulna gets the same shelf as one in Dhaka.",
  },
  {
    stage: "Today",
    title: "A circle, still turning",
    body: "Every title that comes back goes out again. That is the whole ambition: books that travel, and readers who never run out.",
  },
];

const values = [
  {
    title: "Eco-conscious circulation",
    body: "Sharing is the product. One copy that passes through many hands prints less paper than many copies that sit still.",
    icon: "leaf",
  },
  {
    title: "Zero-penalty reading",
    body: "No due dates, no fines, no shaming a slow reader. The deposit covers a lost book, not a busy month.",
    icon: "book",
  },
  {
    title: "Fair doorstep logistics",
    body: "Delivery priced at cost, split with you, free through BD Post — and you may open the parcel before accepting it.",
    icon: "truck",
  },
] as const;

function ValueIcon({ name }: { name: (typeof values)[number]["icon"] }) {
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
  if (name === "leaf") {
    return (
      <svg {...common}>
        <path d="M5 19c0-8 5-13 15-14 1 10-4 15-12 15H5v-1Z" />
        <path d="M5 19c3-5 7-8 12-10" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export default async function AboutPage() {
  const shelf = await getShelfBooks(6);
  const covers = shelf.books;

  return (
    <>
      {/* ------------------------------------------- Asymmetric editorial hero */}
      <section className="border-b border-line bg-cream">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[3fr_2fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow">About Rey</p>
            <h1 className="mt-5 max-w-2xl text-ink">
              Our story: built by readers, <em className="italic">for readers.</em>
            </h1>
            <div className="mt-8 max-w-xl space-y-5 text-base leading-[1.75] text-ink-soft">
              <p>
                Rey began with a stack of books in a Dhaka flat and a small irritation: the best
                ones had already been read, and the shelves were full anyway. Buying every book you
                want to read is expensive and it fills the room you live in.
              </p>
              <p>
                So we lent ours out. Then we lent other people&apos;s. What started as passing books
                between friends became a subscription with couriers behind it — a library that
                arrives at your door, waits as long as you need, and collects what you have
                finished.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/plans" className="btn btn-primary">
                See the plans
              </Link>
              <Link
                href="/library"
                className="inline-flex min-h-6 items-center text-sm text-ink-soft underline decoration-ink/30 hover:decoration-ink"
              >
                Browse the library
              </Link>
            </div>
          </div>

          {/* The floating frame: a nook, a reader, a cup going cold. */}
          <Reveal className="relative">
            <div className="rotate-1 rounded-3xl border border-line bg-white p-6 shadow-paper">
              <WindowNook />
              <p className="label-mono mt-5 border-t border-line pt-4">
                Our reader, somewhere in Dhaka
              </p>
            </div>

            {covers.length ? (
              <div className="absolute -bottom-6 -left-6 hidden -rotate-3 rounded-2xl border border-line bg-white p-3 shadow-lift lg:block">
                <div className="flex gap-2">
                  {covers.slice(0, 4).map((book) => (
                    <BookCoverImage
                      key={book.id}
                      url={book.cover_url}
                      title={book.title}
                      size="sm"
                      className="h-20 w-14 rounded border border-line"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ The manifesto */}
      <section className="bg-ink text-paper">
        <div className="container-page py-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="label-mono !text-paper/60">Our manifesto</p>
            <blockquote className="mt-8 font-display text-3xl font-bold leading-[1.25] tracking-tight text-paper sm:text-4xl lg:text-5xl">
              “We believe a book&apos;s journey shouldn&apos;t end on a dusty bookshelf. Books are
              meant to travel, <em className="italic">inspire, and be shared.</em>”
            </blockquote>
            <p className="mt-8 text-base leading-relaxed text-paper/70">
              That sentence is the whole business model. Everything else — the plans, the couriers,
              the deposits — exists to keep books moving.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------- Staggered narrative rows */}
      <section className="container-page py-20">
        <div className="space-y-14 lg:space-y-20">
          <Reveal className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="rounded-3xl border border-line bg-mist p-3 shadow-paper sm:p-4">
              <div className="grid grid-cols-3 gap-3">
                {covers.slice(0, 6).map((book, index) => (
                  <div
                    key={book.id}
                    className={`overflow-hidden rounded-card border border-line bg-white ${
                      index < 2 ? "" : "opacity-40"
                    }`}
                  >
                    <BookCoverImage
                      url={book.cover_url}
                      title={book.title}
                      size="sm"
                      className="aspect-[2/3] w-full"
                    />
                  </div>
                ))}
              </div>
              <p className="label-mono mt-6 text-center">Six bought · two read</p>
            </div>

            <div>
              <p className="eyebrow">Why we exist</p>
              <h2 className="mt-4 max-w-lg">
                The problem was never reading. It was <em className="italic">owning.</em>
              </h2>
              <div className="mt-6 max-w-xl space-y-5 text-base leading-[1.75] text-ink-soft">
                <p>
                  A hardcover costs the better part of a day&apos;s wages, and reading it takes a
                  week. Then it has to live somewhere — and in a flat with two rooms, the shelf runs
                  out long before the appetite does.
                </p>
                <p>
                  Meanwhile the social science, the old biography, the translated novel sit unopened
                  for years. The books are not the problem; the ownership is.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="lg:order-2">
              <div className="rounded-3xl border border-line bg-white p-3 shadow-paper sm:p-4">
                <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8">
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-mist text-ink">
                                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-11 w-11" aria-hidden>
                          <path d="M5 37h38" />
                          <path d="M9 37V24h9v13" />
                          <path d="M26 17l11-4 5 13-11 4z" />
                          <path d="M31 13l5 13" />
                        </svg>
                      </span>
                      <span className="label-mono">Borrowed</span>
                    </span>
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-mist text-ink">
                                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-11 w-11" aria-hidden>
                          <path d="M24 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
                          <path d="M13 42c0-10 5-17 11-17s11 7 11 17" />
                          <path d="M19 33h10l5 6-5 6H19l-5-6 5-6Z" />
                          <path d="M24 33v12" />
                        </svg>
                      </span>
                      <span className="label-mono">Read</span>
                    </span>
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-mist text-ink">
                                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-11 w-11" aria-hidden>
                          <path d="M14 19h20v19H14z" />
                          <path d="M14 27h20" />
                          <path d="M24 19v19" />
                          <path d="M9 24H5M9 31H5M9 38H5" />
                        </svg>
                      </span>
                      <span className="label-mono">Collected</span>
                    </span>
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-mist text-ink opacity-45">
                                                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-11 w-11" aria-hidden>
                          <path d="M7 40h34" />
                          <path d="M12 40V29h8v11" />
                          <path d="M24 40V29h8v11" />
                          <path d="M38 6c6 5 7 13 1 17" />
                          <path d="M36 22l4-1 1 6" />
                        </svg>
                      </span>
                      <span className="label-mono">Back out</span>
                    </span>
                </div>
                <p className="mt-8 border-t border-line pt-5 text-center text-base leading-relaxed text-ink-soft">
                  The same copy, coming back round — bought once, read many times.
                </p>
              </div>
            </div>

            <div className="lg:order-1">
              <p className="eyebrow">The circular answer</p>
              <h2 className="mt-4 max-w-lg">
                One copy, <em className="italic">dozens of minds.</em>
              </h2>
              <div className="mt-6 max-w-xl space-y-5 text-base leading-[1.75] text-ink-soft">
                <p>
                  We buy the title once. It goes to you, then comes back, then out again — cleaned,
                  checked, and carried the next leg by whoever wants it. The shelf stays in our
                  warehouse; the reading happens in your home.
                </p>
                <p>
                  Readers tell us what to add. A request for a rare Bangladeshi title sends us
                  hunting, and when it arrives it joins the same circle as everything else.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/authors" className="btn btn-outline">
                  Meet the authors
                </Link>
                <Link
                  href="/rare"
                  className="inline-flex min-h-6 items-center text-sm text-ink-soft underline decoration-ink/30 hover:decoration-ink"
                >
                  Request a title we don&apos;t have
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- The timeline */}
      <section className="border-y border-line bg-mist">
        <div className="container-page py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">How it grew</p>
            <h2 className="mt-4">
              From a spare shelf to <em className="italic">a national circuit.</em>
            </h2>
          </div>

          <Timeline items={milestones} />
        </div>
      </section>

      {/* ----------------------------------------------------------- Values */}
      <section className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What we will not trade away</p>
          <h2 className="mt-4">
            Three promises, <em className="italic">kept plainly.</em>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <Reveal
              key={value.title}
              delay={index * 100}
              className="rounded-3xl border border-line bg-white p-8 text-center shadow-card"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-mist text-ink">
                <ValueIcon name={value.icon} />
              </span>
              <h3 className="mt-6 text-xl">{value.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">{value.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- Letter and CTA */}
      <section className="border-t border-line bg-cream">
        <div className="container-page pb-10 pt-20">
          <Reveal className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-paper sm:p-10">
              <p className="label-mono">A note from the shelf</p>

              <div className="mt-8 space-y-5 font-display text-lg leading-[1.7] text-ink">
                <p>To whoever is reading this,</p>
                <p>
                  We started Rey because reading had become a decision about money and space rather
                  than about what we wanted to read next. If that sounds familiar, the club was
                  built for you.
                </p>
                <p>
                  Tell us what you want on the shelf. We will keep buying, keep carrying, and keep
                  the circle turning — one book, many readers, for as long as people in this country
                  want something good to read.
                </p>
              </div>

              <div className="mt-10 border-t border-line pt-6">
                <p className="text-sm text-ink-muted">With thanks,</p>
                <span className="mt-2 block text-ink">
                  <Signature />
                </span>
                <p className="label-mono mt-3">Rey Book Rental Services · Dhaka</p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/library" className="btn btn-primary">
                  Explore our catalog &amp; join the movement
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex min-h-6 items-center text-sm text-ink-soft underline decoration-ink/30 hover:decoration-ink"
                >
                  Or see the rental plans
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
