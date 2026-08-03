import "server-only";
import { getPlan, type Plan } from "@/lib/plans";
import { getUserPlan, listPostsForUser, setUserPlan } from "@/lib/store";
import { ensureProfileForUser, listAccounts } from "@/lib/zernio";

/**
 * Server-side plan enforcement + usage reporting.
 *
 * The plan lives on the Firestore user doc (default "free"). Usage is computed
 * live: connected accounts come from Zernio (the source of truth), and the
 * monthly post count comes from our own post history. Routes that create
 * accounts or posts call the check* helpers and return a friendly 403 with
 * code `plan_limit_reached` when a limit is hit.
 */

export interface UsageReport {
  plan: Plan;
  accounts: number;
  maxAccounts: number | null;
  postsThisMonth: number;
  maxPostsPerMonth: number | null;
}

type PlanId = "free" | "pro" | "team";

export async function checkAccountLimit(
  userId: string
): Promise<{ ok: true; plan: Plan } | { ok: false; plan: Plan; error: string }> {
  const plan = getPlan(await getUserPlan(userId));
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
  const plan = getPlan(await getUserPlan(userId));
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
  const plan = getPlan(await getUserPlan(userId));
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
    accounts,
    maxAccounts: plan.maxAccounts,
    postsThisMonth: posts,
    maxPostsPerMonth: plan.maxPostsPerMonth,
  };
}

export async function setUserPlanForUser(userId: string, plan: PlanId) {
  await setUserPlan(userId, plan);
}
