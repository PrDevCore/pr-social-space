import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createAuthUrl, SocialPlatform } from "@/lib/postforme";

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = (await req.json()) as { platform?: SocialPlatform };
  if (!platform) {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  try {
    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;

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
    const errorMessage =
      err instanceof Error && err.message.includes("POSTFORME_API_KEY")
        ? err.message
        : "Failed to create auth URL";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
