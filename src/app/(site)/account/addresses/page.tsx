import { EditAddressForm, NewAddressForm } from "@/components/account/address-form";
import { StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAddresses } from "@/lib/data";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await requireUser("/account/addresses");
  const addresses = await getAddresses(session.userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink">Delivery addresses</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Where should the courier bring your box? You can save several.
        </p>
      </div>

      {addresses.length ? (
        <div className="space-y-6">
          {addresses.map((address) => (
            <details key={address.id} className="card p-6" open={addresses.length === 1}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium text-ink">{address.label}</span>
                    {address.is_default ? (
                      <StatusPill status="active" label="Default" />
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {address.recipient} · {address.phone}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {address.street}, {address.area} {address.city} {address.division}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">Edit</span>
              </summary>

              <div className="mt-6 border-t border-line pt-6">
                <EditAddressForm address={address} />
              </div>
            </details>
          ))}
        </div>
      ) : null}

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink">
          {addresses.length ? "Add another address" : "Add your first address"}
        </h2>
        <div className="mt-5">
          <NewAddressForm />
        </div>
      </div>
    </div>
  );
}
