import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listSocialAccounts } from "@/lib/postforme";
import type { SocialAccount, PlatformId } from "@/lib/socialspace-types";

export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data } = await listSocialAccounts(userId);
    const mapped: SocialAccount[] = data.map((a) => ({
      platform: a.platform as PlatformId,
      handle: a.username || a.display_name || a.id,
      status: "connected" as const,
      followerCount: 0,
    }));
    return NextResponse.json({ accounts: mapped });
  } catch {
    return NextResponse.json({ accounts: [] });
  }
}
