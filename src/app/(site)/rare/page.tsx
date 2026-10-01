import { BookCard } from "@/components/book-card";
import { RareRequestForm } from "@/components/rare-request-form";
import { SectionHeading } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { listBooks } from "@/lib/data";

export const metadata = { title: "Rare & hard to find" };

export default async function RarePage() {
  const [rare, session] = await Promise.all([
    listBooks({ onlyRare: true, perPage: 24 }),
    getSession(),
  ]);

  return (
    <>
      <section className="border-b border-line bg-ink py-16 text-paper">
        <div className="container-page">
          <p className="eyebrow">Rare &amp; hard to find</p>
          <h1 className="mt-3 max-w-3xl text-paper">
            We do not rent these yet — request one and we will try to add it.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-paper/70">
            Out-of-print Bangla classics, imported hardbacks, academic volumes that never make it to
            a local shelf. Tell us what you are hunting for and we will do the legwork.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
          <div>
            <SectionHeading
              eyebrow="In the vault"
              title="Titles we are trying to source"
              description="Request one and we will move it to the front of the queue for the whole club."
            />

            {rare.books.length ? (
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {rare.books.map((book) => (
                  <BookCard key={book.id} book={book} badge="Rare" />
                ))}
              </div>
            ) : (
              <p className="mt-8 text-sm text-ink-muted">
                Nothing in the vault right now. Send us a request anyway.
              </p>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-ink">Request a book</h2>
              <p className="mt-2 text-sm text-ink-soft">
                {session
                  ? "We will email you when it lands on the shelves."
                  : "Leave a phone number or email and we will tell you when it arrives."}
              </p>
              <div className="mt-6">
                <RareRequestForm contactHint={session ? "optional, we have your account" : "required"} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
