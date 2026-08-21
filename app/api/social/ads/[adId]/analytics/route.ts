import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, getAdAnalytics, listAds } from "@/lib/zernio";

// GET /api/social/ads/[adId]/analytics?from=..&to=..
// Ad-level performance (spend, impressions, clicks, engagement). Ownership is
// re-verified against the user's own ads first.
export async function GET(
  req: NextRequest,
  { params }: { params: { adId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const ownAds = await listAds(profileId, 500);
    if (!ownAds.some((a) => a.id === params.adId)) {
      return NextResponse.json({ error: "Not your ad" }, { status: 403 });
    }

    const from = req.nextUrl.searchParams.get("from") ?? undefined;
    const to = req.nextUrl.searchParams.get("to") ?? undefined;
    const analytics = await getAdAnalytics(params.adId, { from, to });
    return NextResponse.json(analytics);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load ad analytics" }, { status: 502 });
  }
}
