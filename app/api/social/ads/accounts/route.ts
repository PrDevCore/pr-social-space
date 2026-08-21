import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts, listAdsAccounts } from "@/lib/zernio";

// GET /api/social/ads/accounts?accountId=.. — platform ad accounts available
// for one of the user's connected social accounts (e.g. Meta act_123).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const ownedAccounts = await listAccounts(profileId);
    if (!ownedAccounts.some((a) => a.id === accountId)) {
      return NextResponse.json({ error: "Not your account" }, { status: 403 });
    }

    const accounts = await listAdsAccounts(accountId);
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load ads accounts" }, { status: 502 });
  }
}
