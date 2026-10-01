import { ImportForm } from "@/components/admin/import-form";
import { publishHighDemandAction } from "@/lib/actions/admin";

export const metadata = { title: "Import books" };

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Import books</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Search a title, author or ISBN and import it with its cover, description and author filled
          in — or fill the shelves in bulk from a CSV or the Open Library presets. Duplicate ISBNs and
          titles are updated rather than duplicated.
        </p>
      </div>

      <section className="card p-6">
        <ImportForm />
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Publishing rules</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Titles from the search screen use that screen&apos;s <em>publish immediately</em> toggle;
          CSV rows follow their <code>status</code> column. You can also publish everything in the
          high-demand tier in one go — useful after a bulk import.
        </p>
        <form action={publishHighDemandAction} className="mt-5">
          <button type="submit" className="btn btn-outline">
            Publish all high-demand books
          </button>
        </form>
      </section>
    </div>
  );
}
