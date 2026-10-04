import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAuthUrl, ensureProfileForUser, SocialPlatform } from "@/lib/zernio";
import { createMetaAuthUrl } from "@/lib/meta";
import { checkAccountLimit } from "@/lib/plan-usage";

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
    // Plan cap: Free users may connect up to their plan's account limit.
    const limit = await checkAccountLimit(user.id);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: limit.error,
          code: "plan_limit_reached",
          plan: limit.plan.id,
        },
        { status: 403 }
      );
    }

    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
    const redirectUri = `${appUrl}/api/social/callback`;
    if (platform === "facebook" || platform === "instagram") {
      const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })).toString("base64url");
      const response = NextResponse.json({ url: createMetaAuthUrl(state, redirectUri) });
      response.cookies.set("meta_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/social/callback", maxAge: 600 });
      return response;
    }

    const profileId = await ensureProfileForUser(user.id);
    const { authUrl } = await createAuthUrl({ platform, profileId, redirectUrl: redirectUri });
    return NextResponse.json({ url: authUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create auth URL" },
      { status: 502 }
    );
  }
}
