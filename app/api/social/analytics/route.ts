import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureProfileForUser,
  getAnalytics,
  getBestTime,
  getDailyMetrics,
  getFollowerStats,
} from "@/lib/zernio";
import { getActivePlan } from "@/lib/plan-usage";

/**
 * Analytics dashboard data.
 *
 * GET /api/social/analytics?tab=posts&from=...&to=...&limit=...
 * GET /api/social/analytics?tab=daily&from=...&to=...
 * GET /api/social/analytics?tab=besttime&platform=...
 * GET /api/social/analytics?tab=followers&from=...&to=...
 *
 * The Zernio Analytics add-on is required; a missing add-on returns 403 with
 * code `analytics_addon_required` so the UI can show an upsell state.
 */

function isAnalyticsAddonError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return msg.includes("402") || msg.includes("analytics_addon");
}

function addonResponse() {
  return NextResponse.json(
    {
      error: "The Zernio Analytics add-on isn't enabled for this account.",
      code: "analytics_addon_required",
      requiresAddon: true,
    },
    { status: 403 }
  );
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tab = searchParams.get("tab") ?? "posts";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 50);
  const platform = searchParams.get("platform") ?? undefined;

  try {
    const profileId = await ensureProfileForUser(user.id);

    switch (tab) {
      case "daily": {
        const data = await getDailyMetrics(profileId, { from, to });
        return NextResponse.json(data);
      }
      case "besttime": {
        // Best-time recommendations are a Pro/Team capability.
        const plan = await getActivePlan(user.id);
        if (!plan.capability.bestTime) {
          return NextResponse.json(
            {
              error: `Best-time recommendations are available on Pro and above. Upgrade your ${plan.name} plan.`,
              code: "plan_capability_required",
              plan: plan.id,
            },
            { status: 403 }
          );
        }
        const data = await getBestTime(profileId, platform);
        return NextResponse.json(data);
      }
      case "followers": {
        const data = await getFollowerStats({ profileId, from, to });
        return NextResponse.json(data);
      }
      case "posts":
      default: {
        const data = await getAnalytics(profileId, { from, to, limit });
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    if (isAnalyticsAddonError(err)) return addonResponse();
    throw err;
  }
}
