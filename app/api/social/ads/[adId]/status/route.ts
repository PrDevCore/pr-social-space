import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAds, setAdStatus } from "@/lib/zernio";

// PUT /api/social/ads/[adId]/status { status: "active" | "paused" }
// Pause/resume one of the user's ads. Ownership is re-verified against the
// user's own ads before touching anything.
export async function PUT(
  req: NextRequest,
  { params }: { params: { adId: string } }
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
    const ownAds = await listAds(profileId, 500);
    if (!ownAds.some((a) => a.id === params.adId)) {
      return NextResponse.json({ error: "Not your ad" }, { status: 403 });
    }

    const result = await setAdStatus(params.adId, status as "active" | "paused");
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update ad status" }, { status: 502 });
  }
}
