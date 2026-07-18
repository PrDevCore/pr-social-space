import { auth } from "@clerk/nextjs/server";
import { listSocialAccounts, SocialAccount } from "@/lib/postforme";
import SocialDashboard from "@/components/SocialDashboard";

// [ Redirect to /dashboard ]
// middleware.ts already guarantees userId exists here (route is protected),
// but we double-check for type-safety / defense in depth.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { isSuccess?: string; provider?: string; error?: string };
}) {
  const { userId } = await auth();
  if (!userId) return null;

  let accounts: SocialAccount[] = [];
  let loadError: string | null = null;
  try {
    const res = await listSocialAccounts(userId);
    accounts = res.data;
  } catch (err) {
    console.error(err);
    loadError =
      err instanceof Error && err.message.includes("POSTFORME_API_KEY")
        ? "Post for Me is not configured. Set POSTFORME_API_KEY in your environment."
        : "Couldn't reach Post for Me. Check POSTFORME_API_KEY in your environment.";
  }

  const justConnected = searchParams.isSuccess === "true";
  const connectionFailed = searchParams.isSuccess === "false";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-black/60">
          Connect your social accounts and publish to all of them at once.
        </p>
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
