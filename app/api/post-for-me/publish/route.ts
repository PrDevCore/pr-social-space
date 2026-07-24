import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createSocialPost, listSocialAccounts } from "@/lib/postforme";
import { postsStore, addPost, addApiLog } from "@/lib/socialspace-store";
import type { Post, PlatformId } from "@/lib/socialspace-types";

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caption, platforms, mediaUrls } = await req.json();
  if (!caption || !platforms?.length) {
    return NextResponse.json({ error: "Caption and platforms are required" }, { status: 400 });
  }

  const platformMap: Record<string, string> = {
    twitter: "x", linkedin: "linkedin", facebook: "facebook", instagram: "instagram",
    pinterest: "pinterest", tiktok: "tiktok", youtube: "youtube", threads: "threads", bluesky: "bluesky", mastodon: "mastodon"
  };
  const pfmPlatforms = platforms.map((p: string) => platformMap[p] || p);

  try {
    const { data: ownedAccounts } = await listSocialAccounts(userId);
    const ownedIds = ownedAccounts.map((a) => a.id);
    const startTime = Date.now();

    const result = await createSocialPost({
      caption,
      socialAccountIds: ownedIds,
      mediaUrls: mediaUrls || undefined,
    });

    const newPost: Post = {
      id: result.id,
      caption,
      platforms,
      mediaUrls: mediaUrls || [],
      status: "published",
      createdAt: new Date().toISOString(),
      apiResponse: result,
      requestPayload: { caption, platforms: pfmPlatforms, mediaUrls }
    };
    addPost(newPost);

    addApiLog({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      endpoint: "/v1/social-posts",
      method: "POST",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      requestBody: { caption, platforms: pfmPlatforms, mediaUrls },
      responseBody: result,
      isSimulated: false
    });

    return NextResponse.json({ post: newPost });
  } catch (err: any) {
    const startTime = Date.now();
    const errorPost: Post = {
      id: "failed_" + Date.now(),
      caption,
      platforms,
      mediaUrls: mediaUrls || [],
      status: "failed",
      createdAt: new Date().toISOString(),
      error: err.message
    };
    addPost(errorPost);

    addApiLog({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      endpoint: "/v1/social-posts",
      method: "POST",
      statusCode: 502,
      durationMs: 0,
      requestBody: { caption, platforms: pfmPlatforms, mediaUrls },
      responseBody: { error: err.message },
      isSimulated: false
    });

    return NextResponse.json({ post: errorPost, error: err.message });
  }
}
