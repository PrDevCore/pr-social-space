import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSocialPost, listSocialAccounts } from "@/lib/postforme";
import { listPostsForUser, recordPost } from "@/lib/store";

// GET /api/social/posts — this user's post history from our own backend.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await listPostsForUser(userId);
  return NextResponse.json({ posts });
}

// POST /api/social/posts { caption, socialAccountIds, mediaUrls?, scheduledAt? }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    caption?: string;
    socialAccountIds?: string[];
    mediaUrls?: string[];
    scheduledAt?: string;
  };

  if (!body.caption || !body.socialAccountIds?.length) {
    return NextResponse.json(
      { error: "caption and socialAccountIds are required" },
      { status: 400 }
    );
  }

  try {
    // Ownership check: only allow posting to accounts this user connected.
    const { data: ownedAccounts } = await listSocialAccounts(userId);
    const ownedIds = new Set(ownedAccounts.map((a) => a.id));
    const unauthorized = body.socialAccountIds.filter((id) => !ownedIds.has(id));
    if (unauthorized.length) {
      return NextResponse.json(
        { error: `Not your accounts: ${unauthorized.join(", ")}` },
        { status: 403 }
      );
    }

    const result = await createSocialPost({
      caption: body.caption,
      socialAccountIds: body.socialAccountIds,
      mediaUrls: body.mediaUrls,
      scheduledAt: body.scheduledAt,
    });

    await recordPost({
      id: result.id,
      userId,
      caption: body.caption,
      socialAccountIds: body.socialAccountIds,
      status: result.status,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const errorMessage =
      err instanceof Error && err.message.includes("POSTFORME_API_KEY")
        ? err.message
        : "Failed to create post";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
