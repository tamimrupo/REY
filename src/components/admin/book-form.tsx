"use client";

import { useState } from "react";

import { ActionForm } from "@/components/forms/action-form";
import { createClient } from "@/lib/supabase/client";
import { saveBookAction } from "@/lib/actions/admin";
import type { Author, Book, Genre } from "@/lib/types";

function CoverUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="label">Cover image</span>
      <input type="hidden" name="cover_url" value={value} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-cream">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.14em] text-ink-muted">
              No cover
            </div>
          )}
        </div>

        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          {uploading ? <p className="text-xs text-ink-muted">Uploading…</p> : null}
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}

          <button
            type="button"
            onClick={() => setManual((current) => !current)}
            className="text-xs text-ink-muted underline hover:text-ink"
          >
            {manual ? "Hide URL field" : "Or paste an image URL"}
          </button>

          {manual ? (
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="https://…"
              className="field"
            />
          ) : null}

          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="block text-xs text-rose-600 underline"
            >
              Remove cover
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function BookForm({
  book,
  authors,
  genres,
}: {
  book?: Book | null;
  authors: Author[];
  genres: Genre[];
}) {
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");

  return (
    <ActionForm
      action={saveBookAction}
      submitLabel={book ? "Save changes" : "Add book"}
      pendingLabel="Saving…"
      className="space-y-6"
    >
      {book ? <input type="hidden" name="id" value={book.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">
                Title *
              </label>
              <input
                id="title"
                name="title"
                required
                className="field"
                defaultValue={book?.title ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="subtitle">
                Subtitle
              </label>
              <input id="subtitle" name="subtitle" className="field" defaultValue={book?.subtitle ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="slug">
                URL slug
              </label>
              <input
                id="slug"
                name="slug"
                className="field"
                placeholder="auto from title"
                defaultValue={book?.slug ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="author_id">
                Author
              </label>
              <select id="author_id" name="author_id" className="field" defaultValue={book?.author_id ?? ""}>
                <option value="">— none —</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              <input
                name="new_author"
                className="field mt-2"
                placeholder="…or type a new author name"
              />
              <input
                name="author_avatar_url"
                className="field mt-2"
                placeholder="Author photo URL (optional)"
                defaultValue={book?.authors?.avatar_url ?? ""}
              />
              <p className="mt-1 text-xs text-ink-muted">
                The photo appears in the round avatar beside the home-page shelf. Leave it empty to
                show the author&apos;s initials instead.
              </p>
              <input type="hidden" name="original_author_id" value={book?.author_id ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="genre_id">
                Genre
              </label>
              <select id="genre_id" name="genre_id" className="field" defaultValue={book?.genre_id ?? ""}>
                <option value="">— none —</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <input name="new_genre" className="field mt-2" placeholder="…or type a new genre" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="field"
              defaultValue={book?.description ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="language">
                Language
              </label>
              <input id="language" name="language" className="field" defaultValue={book?.language ?? "English"} />
            </div>
            <div>
              <label className="label" htmlFor="published_year">
                Year
              </label>
              <input
                id="published_year"
                name="published_year"
                type="number"
                className="field"
                defaultValue={book?.published_year ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="pages">
                Pages
              </label>
              <input
                id="pages"
                name="pages"
                type="number"
                className="field"
                defaultValue={book?.pages ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="publisher">
                Publisher
              </label>
              <input id="publisher" name="publisher" className="field" defaultValue={book?.publisher ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="isbn">
                ISBN
              </label>
              <input id="isbn" name="isbn" className="field" defaultValue={book?.isbn ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="total_copies">
                Copies owned
              </label>
              <input
                id="total_copies"
                name="total_copies"
                type="number"
                min={1}
                className="field"
                defaultValue={book?.total_copies ?? 1}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <CoverUpload value={coverUrl} onChange={setCoverUrl} />

          <div>
            <span className="label">Rarity</span>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rarity"
                  value="common"
                  defaultChecked={book?.rarity !== "rare"}
                />
                Common — rentable now
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rarity"
                  value="rare"
                  defaultChecked={book?.rarity === "rare"}
                />
                Rare — request only
              </label>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="demand">
              Demand
            </label>
            <select id="demand" name="demand" className="field" defaultValue={book?.demand ?? "medium"}>
              <option value="high">High — publish first</option>
              <option value="medium">Medium — publish after high moves</option>
              <option value="low">Low — keep hidden / rare</option>
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Used by &quot;Publish all high-demand books&quot; after a bulk import.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="replacement_value">
              Replacement value ৳
            </label>
            <input
              id="replacement_value"
              name="replacement_value"
              type="number"
              step="1"
              min={0}
              className="field"
              defaultValue={book?.replacement_value ?? 0}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Charged if a member loses this copy.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="weight_grams">
              Weight (grams)
            </label>
            <input
              id="weight_grams"
              name="weight_grams"
              type="number"
              step="10"
              min={0}
              className="field"
              defaultValue={book?.weight_grams ?? ""}
              placeholder="for BD Post Book Post limits"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={book?.is_active ?? true} />
            Visible in the library
          </label>
        </div>
      </div>
    </ActionForm>
  );
}
