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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/[0.04] sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" aria-hidden="true" />
          <p className="text-sm font-medium text-black/70 dark:text-white/70">Workspace health is being monitored live</p>
        </div>
        <p className="text-xs font-medium text-black/40 dark:text-white/40">Your command center</p>
      </div>
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
