import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createSocialPost, listSocialAccounts } from "@/lib/postforme";
import { postsStore } from "@/lib/socialspace-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = postsStore.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  try {
    const { data: ownedAccounts } = await listSocialAccounts(userId);
    const ownedIds = ownedAccounts.map((a) => a.id);

    const result = await createSocialPost({
      caption: post.caption,
      socialAccountIds: ownedIds,
      mediaUrls: post.mediaUrls.length ? post.mediaUrls : undefined,
    });

    post.status = "published";
    post.apiResponse = result;
    post.error = undefined;

    return NextResponse.json({ post });
  } catch (err: any) {
    post.status = "failed";
    post.error = err.message;
    return NextResponse.json({ post, error: err.message });
  }
}
