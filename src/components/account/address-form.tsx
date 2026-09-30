"use client";

import { ActionForm } from "@/components/forms/action-form";
import { deleteAddressAction, saveAddressAction } from "@/lib/actions/storefront";
import type { Address } from "@/lib/types";

function Fields({ address }: { address?: Address }) {
  return (
    <>
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`label-${address?.id ?? "new"}`}>
            Label
          </label>
          <input
            id={`label-${address?.id ?? "new"}`}
            name="label"
            className="field"
            defaultValue={address?.label ?? "Home"}
          />
        </div>
        <div>
          <label className="label" htmlFor={`recipient-${address?.id ?? "new"}`}>
            Recipient *
          </label>
          <input
            id={`recipient-${address?.id ?? "new"}`}
            name="recipient"
            required
            className="field"
            defaultValue={address?.recipient ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`phone-${address?.id ?? "new"}`}>
            Phone *
          </label>
          <input
            id={`phone-${address?.id ?? "new"}`}
            name="phone"
            required
            className="field"
            defaultValue={address?.phone ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor={`postcode-${address?.id ?? "new"}`}>
            Postcode
          </label>
          <input
            id={`postcode-${address?.id ?? "new"}`}
            name="postcode"
            className="field"
            defaultValue={address?.postcode ?? ""}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`street-${address?.id ?? "new"}`}>
          Street address *
        </label>
        <input
          id={`street-${address?.id ?? "new"}`}
          name="street"
          required
          className="field"
          defaultValue={address?.street ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor={`area-${address?.id ?? "new"}`}>
            Area
          </label>
          <input
            id={`area-${address?.id ?? "new"}`}
            name="area"
            className="field"
            defaultValue={address?.area ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor={`city-${address?.id ?? "new"}`}>
            City
          </label>
          <input
            id={`city-${address?.id ?? "new"}`}
            name="city"
            className="field"
            defaultValue={address?.city ?? "Dhaka"}
          />
        </div>
        <div>
          <label className="label" htmlFor={`division-${address?.id ?? "new"}`}>
            Division
          </label>
          <input
            id={`division-${address?.id ?? "new"}`}
            name="division"
            className="field"
            defaultValue={address?.division ?? "Dhaka"}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default ?? false} />
        Make this my default delivery address
      </label>
    </>
  );
}

export function NewAddressForm() {
  return (
    <ActionForm action={saveAddressAction} submitLabel="Save address" pendingLabel="Saving…">
      <Fields />
    </ActionForm>
  );
}

export function EditAddressForm({ address }: { address: Address }) {
  return (
    <ActionForm
      action={saveAddressAction}
      submitLabel="Update address"
      pendingLabel="Saving…"
      footer={
        <button
          type="submit"
          formAction={deleteAddressAction}
          className="btn btn-ghost"
          formNoValidate
        >
          Delete
        </button>
      }
    >
      <Fields address={address} />
    </ActionForm>
  );
}
