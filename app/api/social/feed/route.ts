import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureProfileForUser,
  listAccounts,
  listInstagramStories,
  listPosts,
} from "@/lib/zernio";

// GET /api/social/feed
// Live feed of the signed-in user's connected accounts: recent published
// posts across their Zernio profile, plus active Instagram stories.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const accounts = await listAccounts(profileId);
    const posts = await listPosts(profileId, 500);

    const stories: {
      accountId: string;
      accountName?: string;
      stories: Awaited<ReturnType<typeof listInstagramStories>>;
    }[] = [];
    for (const account of accounts.filter((a) => a.platform === "instagram")) {
      try {
        const items = await listInstagramStories(account.id);
        if (items.length) {
          stories.push({
            accountId: account.id,
            accountName: account.display_name ?? account.username,
            stories: items,
          });
        }
      } catch (err) {
        console.error("instagram stories:", err);
      }
    }

    return NextResponse.json({ posts, stories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load live feed." },
      { status: 502 }
    );
  }
}
