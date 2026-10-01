"use client";

import { ActionForm } from "@/components/forms/action-form";
import { deleteCmsPageAction, saveCmsPageAction } from "@/lib/actions/admin";
import type { CmsPage } from "@/lib/types";

export function PageForm({ page }: { page?: CmsPage | null }) {
  return (
    <ActionForm
      action={saveCmsPageAction}
      submitLabel={page ? "Save page" : "Create page"}
      pendingLabel="Saving…"
      className="space-y-5"
      footer={
        page ? (
          <button
            type="submit"
            formAction={deleteCmsPageAction}
            className="btn btn-ghost text-ink"
            formNoValidate
          >
            Delete page
          </button>
        ) : null
      }
    >
      {page ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`title-${page?.id ?? "new"}`}>
            Title *
          </label>
          <input
            id={`title-${page?.id ?? "new"}`}
            name="title"
            required
            className="field"
            defaultValue={page?.title ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor={`slug-${page?.id ?? "new"}`}>
            Slug
          </label>
          <input
            id={`slug-${page?.id ?? "new"}`}
            name="slug"
            className="field"
            defaultValue={page?.slug ?? ""}
            placeholder="auto from title"
          />
          <p className="mt-1 text-xs text-ink-muted">Served at /p/your-slug</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`excerpt-${page?.id ?? "new"}`}>
          Excerpt
        </label>
        <input
          id={`excerpt-${page?.id ?? "new"}`}
          name="excerpt"
          className="field"
          defaultValue={page?.excerpt ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor={`content-${page?.id ?? "new"}`}>
          Content
        </label>
        <textarea
          id={`content-${page?.id ?? "new"}`}
          name="content"
          rows={14}
          className="field font-mono text-xs leading-relaxed"
          defaultValue={page?.content ?? ""}
          placeholder={"Leave a blank line between paragraphs."}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`status-${page?.id ?? "new"}`}>
            Status
          </label>
          <select
            id={`status-${page?.id ?? "new"}`}
            name="status"
            className="field"
            defaultValue={page?.status ?? "published"}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`sort-${page?.id ?? "new"}`}>
            Footer order
          </label>
          <input
            id={`sort-${page?.id ?? "new"}`}
            name="sort_order"
            type="number"
            className="field"
            defaultValue={page?.sort_order ?? 0}
          />
        </div>
      </div>
    </ActionForm>
  );
}
