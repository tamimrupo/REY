import Link from "next/link";

import { PageForm } from "@/components/admin/page-form";
import { StatusPill } from "@/components/ui";
import { getCmsPages } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const pages = await getCmsPages(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Pages</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Policies, about text and the FAQ — editable without a deploy.
          </p>
        </div>
        <Link href="/admin/pages/new" className="btn btn-primary btn-sm">
          New page
        </Link>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="font-medium text-ink">{page.title}</td>
                <td className="text-ink-soft">/p/{page.slug}</td>
                <td>
                  <StatusPill status={page.status} />
                </td>
                <td className="whitespace-nowrap text-ink-soft">{formatDate(page.updated_at)}</td>
                <td className="text-right">
                  <Link href={`/admin/pages/${page.id}`} className="btn btn-outline btn-sm">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No pages yet. Create one, or run the seed SQL for the standard policies.
        </p>
      ) : null}

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Create a page</h2>
        <div className="mt-6">
          <PageForm />
        </div>
      </section>
    </div>
  );
}
