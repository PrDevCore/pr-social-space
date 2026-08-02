import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureProfileForUser,
  listAccounts,
  listAllPosts,
} from "@/lib/zernio";

// GET /api/social/content
// All media across the signed-in user's posts (published, partial and
// scheduled) together with the connected accounts, for the full-media
// content gallery. Uses the raw media URLs so tiles render full size.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const [accounts, posts] = await Promise.all([
      listAccounts(profileId),
      listAllPosts(profileId, 200),
    ]);
    return NextResponse.json({ posts, accounts });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load content." },
      { status: 502 }
    );
  }
}
