import Link from "next/link";
import { notFound } from "next/navigation";

import { PageForm } from "@/components/admin/page-form";
import { getCmsPageById } from "@/lib/data";

export const metadata = { title: "Edit page" };

export default async function EditPageRoute(props: PageProps<"/admin/pages/[id]">) {
  const { id } = await props.params;
  const page = await getCmsPageById(id);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/pages" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-gold">
            ← Pages
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{page.title}</h1>
        </div>
        <Link href={`/p/${page.slug}`} className="btn btn-outline btn-sm">
          View on site
        </Link>
      </div>

      <div className="card p-6">
        <PageForm page={page} />
      </div>
    </div>
  );
}
