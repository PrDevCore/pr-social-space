import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildReportPdf } from "@/lib/report-pdf";
import { getActivePlan } from "@/lib/plan-usage";
import {
  ensureProfileForUser,
  getAnalytics,
  getDailyMetrics,
  getFollowerStats,
} from "@/lib/zernio";

/**
 * GET /api/reports/pdf?from=...&to=...
 * Generates a branded PDF analytics report for the signed-in user's profile.
 * Protected by middleware and requires the Analytics add-on.
 */

export const runtime = "nodejs";

function isAddonError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return msg.includes("402") || msg.includes("analytics_addon");
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  // PDF reports are a Pro/Team capability.
  const plan = await getActivePlan(user.id);
  if (!plan.capability.pdfReports) {
    return NextResponse.json(
      {
        error: `PDF reports are available on Pro and above. Upgrade your ${plan.name} plan to export.`,
        code: "plan_capability_required",
        plan: plan.id,
      },
      { status: 403 }
    );
  }

  let profileId: string;
  let posts;
  let daily;
  let followers;
  try {
    profileId = await ensureProfileForUser(user.id);
    const [p, d, f] = await Promise.all([
      getAnalytics(profileId, { from, to, limit: 50 }),
      getDailyMetrics(profileId, { from, to }),
      getFollowerStats({ profileId, from, to }),
    ]);
    posts = p.posts ?? [];
    daily = d.dailyData ?? [];
    const stats = f.stats ?? {};
    const firstAccount = Object.keys(stats)[0];
    followers = firstAccount ? (stats[firstAccount] ?? []) : [];
  } catch (err) {
    if (isAddonError(err)) {
      return NextResponse.json(
        { error: "Analytics add-on required to export reports.", code: "analytics_addon_required" },
        { status: 403 }
      );
    }
    throw err;
  }

  try {
    const buffer = await buildReportPdf({ email: user.email, from, to, posts, daily, followers });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="social-hub-report-${from ?? "start"}-${to ?? "today"}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't generate the PDF report." }, { status: 500 });
  }
}
