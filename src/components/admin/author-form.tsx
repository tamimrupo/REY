"use client";

import { useState } from "react";

import { ActionForm } from "@/components/forms/action-form";
import { createClient } from "@/lib/supabase/client";
import { saveAuthorAction } from "@/lib/actions/admin";

/**
 * Edit an author on their own screen: name, photo, bio and the URL of their page.
 *
 * The upload mirrors the cover uploader in the book form — same bucket, an
 * `authors/` prefix — so a photo can be added without hosting it somewhere
 * first. Renaming here is safe: the slug is only changed when you type a new
 * one, so shared links keep working.
 */
export function AuthorForm({
  author,
}: {
  author: { id: string; name: string; slug: string; avatarUrl: string; bio: string };
}) {
  const [photo, setPhoto] = useState(author.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setNote("");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `authors/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("book-covers")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      setPhoto(data.publicUrl);
      setNote("Photo uploaded. Save to apply it.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ActionForm action={saveAuthorAction} submitLabel="Save author" pendingLabel="Saving…">
      <input type="hidden" name="id" value={author.id} />
      <input type="hidden" name="avatar_url" value={photo} />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="name">
              Name *
            </label>
            <input
              id="name"
              name="name"
              required
              className="field"
              defaultValue={author.name}
              placeholder="রবীন্দ্রনাথ ঠাকুর"
            />
            <p className="mt-1 text-meta text-ink-muted">
              Bangla is fine — the shop renders it in a Bengali face, everywhere their name appears.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              className="field"
              defaultValue={author.bio}
              placeholder="Two or three sentences for the author card on every book page."
            />
          </div>

          <div>
            <label className="label" htmlFor="slug">
              Page address
            </label>
            <input
              id="slug"
              name="slug"
              className="field"
              defaultValue={author.slug}
              placeholder="rabindranath-tagore"
            />
            <p className="mt-1 text-meta text-ink-muted">
              /author/{author.slug || "…"} — leave it alone unless you need to change the link.
            </p>
          </div>
        </div>

        <div>
          <span className="label">Photo</span>
          <div className="overflow-hidden rounded-card border border-line bg-cream">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center p-4 text-center text-xs text-ink-muted">
                No photo yet
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            className="mt-3 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {uploading ? (
            <p className="mt-1 flex items-center gap-2 text-meta text-ink-muted">
              <span aria-hidden className="spinner" /> Uploading…
            </p>
          ) : null}
          {note ? <p className="mt-1 text-meta text-ink-muted">{note}</p> : null}

          <input
            className="field mt-3"
            placeholder="…or paste a photo URL"
            value={photo}
            onChange={(event) => setPhoto(event.target.value)}
          />
        </div>
      </div>
    </ActionForm>
  );
}
