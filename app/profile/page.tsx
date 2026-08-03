import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import PlanCard from "@/components/PlanCard";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-black/60">
          Manage your account details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-white">
            {initials}
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight">{user.name}</p>
            <p className="text-sm text-black/50">{user.email}</p>
          </div>
          <p className="text-xs text-black/40">Member since {joined}</p>
        </aside>

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Edit details
            </h2>
            <ProfileForm name={user.name} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Billing
            </h2>
            <PlanCard />
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
              Account
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">User ID</dt>
                <dd className="truncate font-mono text-xs">{user.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Joined</dt>
                <dd>{joined}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/[0.03] px-4 py-3 text-xs text-black/50">
              <Image
                src="/logo.png"
                alt="Social Hub"
                width={20}
                height={20}
                className="rounded"
              />
              Secured with scrypt password hashing and encrypted sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
