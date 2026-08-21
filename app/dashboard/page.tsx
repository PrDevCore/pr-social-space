import { redirect } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts, SocialAccount } from "@/lib/zernio";
import OnboardingWizard from "@/components/OnboardingWizard";
import SocialDashboard from "@/components/SocialDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// [ Redirect to /dashboard ]
// middleware.ts already guarantees a session exists here (route is protected),
// but we re-validate it for type-safety / defense in depth.
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
      {!user.onboarding.completed && <OnboardingWizard user={user} />}
      <DashboardHeader name={user.name} status={loadError ? "error" : "optimal"} />

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

      <SocialDashboard initialAccounts={accounts} apiError={!!loadError} />
    </div>
  );
}