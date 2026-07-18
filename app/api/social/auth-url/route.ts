import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthUrl, SocialPlatform } from "@/lib/postforme";

// [ Call Post for Me Auth URL Endpoint ]
// The frontend hits this route after the user clicks "Connect X account".
// We stamp the request with external_id = Clerk userId so the account we
// get back is scoped to this user (see lib/postforme.ts + Post for Me's
// "Multi-User Applications" guide).
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = (await req.json()) as { platform?: SocialPlatform };
  if (!platform) {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  try {
    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;

    // LinkedIn on Quickstart requires connection_type "organization",
    // Instagram requires an explicit connection_type too — see Post for
    // Me's Account Connections troubleshooting guide.
    const platformData: Record<string, unknown> | undefined =
      platform === "linkedin"
        ? { linkedin: { connection_type: "organization" } }
        : platform === "instagram"
        ? { instagram: { connection_type: "instagram" } }
        : undefined;

    const { url } = await createAuthUrl({
      platform,
      externalId: userId,
      redirectUrlOverride: `${appUrl}/api/social/callback`,
      platformData,
      permissions: ["posts", "feeds"],
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create auth URL" },
      { status: 502 }
    );
  }
}
