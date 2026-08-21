import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  AdsConnectPlatform,
  connectAdsAccount,
  ensureProfileForUser,
  listAccounts,
} from "@/lib/zernio";

// POST /api/social/ads/auth-url { platform, accountId? }
// Frontend calls this after the user clicks "Connect ads account" — we resolve
// the user's Zernio profile, verify the (optional) social account belongs to
// them, and return the Zernio OAuth URL for linking a platform ads account.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    platform?: AdsConnectPlatform;
    accountId?: string;
  };
  if (!body.platform) {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);

    // Ownership check: an ads connection may only be linked to an account
    // this user already connected to Social Hub.
    let accountId: string | undefined;
    if (body.accountId) {
      const ownedAccounts = await listAccounts(profileId);
      if (!ownedAccounts.some((a) => a.id === body.accountId)) {
        return NextResponse.json(
          { error: "Not your account" },
          { status: 403 }
        );
      }
      accountId = body.accountId;
    }

    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
    const result = await connectAdsAccount({
      platform: body.platform,
      profileId,
      accountId,
      redirectUrl: `${appUrl}/api/social/callback`,
    });

    if (result.alreadyConnected) {
      return NextResponse.json({ alreadyConnected: true });
    }
    return NextResponse.json({ url: result.authUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create ads auth URL" },
      { status: 502 }
    );
  }
}
