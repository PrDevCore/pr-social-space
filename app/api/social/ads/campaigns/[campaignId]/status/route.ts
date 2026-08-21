import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAdCampaigns, setAdCampaignStatus } from "@/lib/zernio";

// PUT /api/social/ads/campaigns/[campaignId]/status { status: "active" | "paused" }
// Pause/resume one of the user's campaigns. Ownership is re-verified against
// the user's own campaigns before touching anything.
export async function PUT(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = (await req.json()) as { status?: string };
  if (!status || !["active", "paused"].includes(status)) {
    return NextResponse.json({ error: "status must be active or paused" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const ownCampaigns = await listAdCampaigns(profileId);
    const match = ownCampaigns.find(
      (c) => c.platformCampaignId === params.campaignId
    );
    if (!match) {
      return NextResponse.json({ error: "Not your campaign" }, { status: 403 });
    }

    const result = await setAdCampaignStatus(
      params.campaignId,
      status as "active" | "paused",
      match.platform
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update campaign status" },
      { status: 502 }
    );
  }
}
