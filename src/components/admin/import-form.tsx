"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { importBooksAction, previewImportAction } from "@/lib/actions/admin";
import { OPEN_LIBRARY_PRESETS } from "@/lib/import";

export function ImportForm() {
  const [state, importAction] = useActionState(importBooksAction, null);
  const [previewState, previewAction] = useActionState(previewImportAction, null);

  const [source, setSource] = useState<"csv" | "openlibrary">("csv");
  const [csv, setCsv] = useState("");
  const [preset, setPreset] = useState(OPEN_LIBRARY_PRESETS[0]?.key ?? "world");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [publish, setPublish] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSource("csv")}
          className={`btn btn-sm ${source === "csv" ? "btn-primary" : "btn-outline"}`}
        >
          Paste / upload CSV
        </button>
        <button
          type="button"
          onClick={() => setSource("openlibrary")}
          className={`btn btn-sm ${source === "openlibrary" ? "btn-primary" : "btn-outline"}`}
        >
          Open Library search
        </button>
      </div>

      <form action={importAction} className="space-y-5">
        <input type="hidden" name="source" value={source} />

        {source === "csv" ? (
          <>
            <div>
              <label className="label" htmlFor="csv">
                CSV rows
              </label>
              <textarea
                id="csv"
                name="csv"
                rows={10}
                className="field font-mono text-xs"
                placeholder={`title,author,isbn,categories,rarity,description,price,stock,image_url,publisher,year,language,status
The Silent Patient,Alex Michaelides,9781250301697,"Thriller, Fiction",standard,A woman shoots her husband then never speaks.,800,3,,Celadon,2019,English,publish`}
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
              />
              <p className="mt-2 text-xs text-ink-muted">
                Header row required. Only <code>title</code> is mandatory. Duplicate ISBNs and titles
                are updated instead of duplicated. Max 200 rows per run.
              </p>
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="preset">
                Preset
              </label>
              <select
                id="preset"
                name="preset"
                className="field"
                value={preset}
                onChange={(event) => setPreset(event.target.value)}
              >
                {OPEN_LIBRARY_PRESETS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="query">
                …or your own Open Library search
              </label>
              <input
                id="query"
                name="query"
                className="field"
                placeholder="subject:bengali OR language:ben"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="limit">
                How many
              </label>
              <input
                id="limit"
                name="limit"
                type="number"
                min={5}
                max={50}
                className="field"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="offset">
                Skip (offset)
              </label>
              <input
                id="offset"
                name="offset"
                type="number"
                min={0}
                className="field"
                value={offset}
                onChange={(event) => setOffset(Number(event.target.value))}
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publish"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
          />
          Publish every imported title immediately
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel="Importing…">Import books</SubmitButton>
          <SubmitButton
            className="btn btn-outline"
            pendingLabel="Checking…"
            formAction={previewAction}
          >
            Preview first
          </SubmitButton>
        </div>

        {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      </form>

      {previewState ? (
        <Alert tone={previewState.ok ? "info" : "error"}>
          <span className="whitespace-pre-line">{previewState.message}</span>
        </Alert>
      ) : null}
    </div>
  );
}
