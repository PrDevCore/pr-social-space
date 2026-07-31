import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAuthUrl, ensureProfileForUser, SocialPlatform } from "@/lib/zernio";

// [ Call Zernio Auth URL Endpoint ]
// The frontend hits this route after the user clicks "Connect X account".
// Each user owns a Zernio profile (see lib/zernio.ts), so the account
// we get back is scoped to this user and to nobody else.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = (await req.json()) as { platform?: SocialPlatform };
  if (!platform) {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;

    const { authUrl } = await createAuthUrl({
      platform,
      profileId,
      redirectUrl: `${appUrl}/api/social/callback`,
    });

    return NextResponse.json({ url: authUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create auth URL" },
      { status: 502 }
    );
  }
}
