"use client";

import { SubmitButton } from "@/components/forms/submit-button";
import { humanize } from "@/lib/format";

/** Small inline form for changing a status from a table row. */
export function StatusSelect({
  action,
  id,
  current,
  options,
  fieldName = "status",
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  current: string;
  options: string[];
  fieldName?: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {Object.entries(hidden ?? {}).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <select
        name={fieldName}
        defaultValue={current}
        className="field w-36 !py-1.5 !text-xs"
        aria-label="Change status"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </select>
      <SubmitButton className="btn btn-outline btn-sm" pendingLabel="…">
        Set
      </SubmitButton>
    </form>
  );
}
