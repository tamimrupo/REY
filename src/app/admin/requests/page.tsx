import { StatusSelect } from "@/components/admin/status-select";
import { EmptyState, StatusPill } from "@/components/ui";
import { setRequestStatusAction } from "@/lib/actions/admin";
import { listRareRequests } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Rare requests" };

const statuses = ["pending", "sourcing", "added", "rejected"];

export default async function AdminRequestsPage() {
  const requests = await listRareRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink">Rare book requests</h1>
        <p className="mt-1 text-sm text-ink-soft">
          What members are hunting for. Mark one as added once it lands on the shelves.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState title="No requests yet" description="Requests from the Rare page appear here." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Requested by</th>
                <th>Note</th>
                <th>Date</th>
                <th>Status</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="max-w-[16rem] font-medium text-ink">{request.title}</td>
                  <td className="text-ink-soft">{request.author || "—"}</td>
                  <td className="text-ink-soft">
                    {request.profiles?.full_name || request.contact || "Guest"}
                    {request.profiles?.phone ? (
                      <span className="block text-xs text-ink-muted">{request.profiles.phone}</span>
                    ) : null}
                  </td>
                  <td className="max-w-[16rem] text-xs text-ink-muted">{request.note || "—"}</td>
                  <td className="whitespace-nowrap text-ink-soft">
                    {formatDate(request.created_at)}
                  </td>
                  <td>
                    <StatusPill status={request.status} />
                  </td>
                  <td>
                    <StatusSelect
                      action={setRequestStatusAction}
                      id={request.id}
                      current={request.status}
                      options={statuses}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
