import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts, SocialAccount } from "@/lib/zernio";
import SocialDashboard from "@/components/SocialDashboard";

// [ Redirect to /dashboard ]
// middleware.ts already guarantees a session exists here (route is protected),
// but we re-validate it for type-safety / defense in depth.
function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { isSuccess?: string; provider?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  let accounts: SocialAccount[] = [];
  let loadError: string | null = null;
  try {
    const profileId = await ensureProfileForUser(user.id);
    accounts = await listAccounts(profileId);
  } catch (err) {
    console.error(err);
    loadError =
      "Couldn't reach Zernio. Check ZERNIO_API_KEY in your environment.";
  }

  const justConnected = searchParams.isSuccess === "true";
  const connectionFailed = searchParams.isSuccess === "false";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-black/50">Social Hub</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {timeOfDay()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          All systems online
        </div>
      </div>

      {justConnected && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {searchParams.provider ?? "Account"} connected successfully.
        </div>
      )}
      {connectionFailed && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Connection failed{searchParams.error ? `: ${searchParams.error}` : "."}
        </div>
      )}
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <SocialDashboard initialAccounts={accounts} />
    </div>
  );
}
