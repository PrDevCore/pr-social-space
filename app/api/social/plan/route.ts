import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUsageReport, setUserPlanForUser } from "@/lib/plan-usage";
import { getPlan, type PlanId } from "@/lib/plans";

/**
 * Plan & usage.
 *
 * GET  /api/social/plan  -> { plan, accounts, maxAccounts, postsThisMonth, maxPostsPerMonth }
 * PATCH /api/social/plan { planId } -> mock upgrade (switches the plan so the
 *                                      rest of the app enforces the new limits)
 */

const PLAN_IDS = new Set<PlanId>(["free", "pro", "team"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const usage = await getUsageReport(user.id);
  return NextResponse.json(usage);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { planId?: string };
  const planId = body.planId as PlanId;
  if (!planId || !PLAN_IDS.has(planId)) {
    return NextResponse.json({ error: "A valid planId is required." }, { status: 400 });
  }

  await setUserPlanForUser(user.id, planId);
  const usage = await getUsageReport(user.id);
  return NextResponse.json({ ...usage, plan: getPlan(planId) });
}
