import Link from "next/link";

import { PageForm } from "@/components/admin/page-form";

export const metadata = { title: "New page" };

export default function NewPageRoute() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="inline-flex min-h-6 items-center text-sm text-ink-soft hover:text-gold">
          ← Pages
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-ink">New page</h1>
      </div>

      <div className="card p-6">
        <PageForm />
      </div>
    </div>
  );
}
