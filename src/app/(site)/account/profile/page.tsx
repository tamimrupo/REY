import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireUser("/account/profile");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-ink">Profile</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Keep your details current so deliveries and receipts reach you.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Your details</h2>
        <div className="mt-5">
          <ProfileForm profile={session.profile} email={session.email} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Password</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Choose something at least 6 characters long.
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink">Session</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Signing out ends this session on this device only.
        </p>
        <form action="/auth/signout" method="post" className="mt-5">
          <button type="submit" className="btn btn-outline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
