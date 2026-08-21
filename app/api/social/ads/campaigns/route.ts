import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAdCampaigns } from "@/lib/zernio";

// GET /api/social/ads/campaigns — the user's ad campaigns (virtual rollups of
// their boosts/ads, scoped to their Zernio profile).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const campaigns = await listAdCampaigns(profileId);
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load campaigns" },
      { status: 502 }
    );
  }
}
