import "server-only";
import { getPlan, type Plan } from "@/lib/plans";
import { getUserPlanStatus, listPostsForUser } from "@/lib/store";
import { ensureProfileForUser, listAccounts } from "@/lib/zernio";

/**
 * Server-side plan enforcement + usage reporting.
 *
 * The plan lives on the Firestore user doc (default "free"). Paid plans carry
 * a `planExpiresAt`; getActivePlan returns the user's plan as Free once that
 * date passes, so expired subscriptions automatically lose paid limits and
 * capabilities. Usage is computed live: connected accounts come from Zernio
 * (the source of truth), and the monthly post count comes from our own post
 * history. Routes that create accounts or posts call the check* helpers and
 * return a friendly 403 with code `plan_limit_reached` when a limit is hit.
 */

export interface UsageReport {
  plan: Plan;
  planId: "free" | "business" | "pro" | "team";
  planExpiresAt: string | null;
  accounts: number;
  maxAccounts: number | null;
  postsThisMonth: number;
  maxPostsPerMonth: number | null;
}

/**
 * The user's effective plan. Paid plans that have expired count as Free so
 * every enforcement point (account/post limits, pdfReports, bestTime, ...)
 * downgrades automatically without a manual step.
 */
export async function getActivePlan(userId: string): Promise<Plan> {
  const { plan, planExpiresAt } = await getUserPlanStatus(userId);
  if (plan === "free") return getPlan("free");
  if (planExpiresAt && new Date(planExpiresAt).getTime() < Date.now()) {
    return getPlan("free");
  }
  return getPlan(plan);
}

export async function checkAccountLimit(
  userId: string
): Promise<{ ok: true; plan: Plan } | { ok: false; plan: Plan; error: string }> {
  const plan = await getActivePlan(userId);
  if (plan.maxAccounts === null) return { ok: true, plan };
  const profileId = await ensureProfileForUser(userId);
  const accounts = await listAccounts(profileId);
  if (accounts.length >= plan.maxAccounts) {
    return {
      ok: false,
      plan,
      error: `You've reached the ${plan.name} limit of ${plan.maxAccounts} connected accounts. Upgrade to connect more.`,
    };
  }
  return { ok: true, plan };
}

export async function checkPostLimit(
  userId: string
): Promise<{ ok: true; plan: Plan } | { ok: false; plan: Plan; error: string }> {
  const plan = await getActivePlan(userId);
  if (plan.maxPostsPerMonth === null) return { ok: true, plan };
  const month = new Date().toISOString().slice(0, 7);
  const posts = await listPostsForUser(userId);
  const count = posts.filter((p) => p.createdAt.startsWith(month)).length;
  if (count >= plan.maxPostsPerMonth) {
    return {
      ok: false,
      plan,
      error: `You've used all ${plan.maxPostsPerMonth} posts on the ${plan.name} plan this month. Upgrade for unlimited posting.`,
    };
  }
  return { ok: true, plan };
}

export async function getUsageReport(userId: string): Promise<UsageReport> {
  const plan = await getActivePlan(userId);
  const { planExpiresAt } = await getUserPlanStatus(userId);
  const profileId = await ensureProfileForUser(userId);
  const month = new Date().toISOString().slice(0, 7);
  const [accounts, posts] = await Promise.all([
    listAccounts(profileId).then((a) => a.length),
    listPostsForUser(userId).then((list) =>
      list.filter((p) => p.createdAt.startsWith(month)).length
    ),
  ]);
  return {
    plan,
    planId: plan.id,
    planExpiresAt,
    accounts,
    maxAccounts: plan.maxAccounts,
    postsThisMonth: posts,
    maxPostsPerMonth: plan.maxPostsPerMonth,
  };
}
