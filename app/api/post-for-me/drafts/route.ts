import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { postsStore, addPost } from "@/lib/socialspace-store";
import type { Post } from "@/lib/socialspace-types";

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caption, platforms, mediaUrls } = await req.json();

  const newPost: Post = {
    id: "draft_" + Date.now(),
    caption: caption || "Untitled Draft",
    platforms: platforms || [],
    mediaUrls: mediaUrls || [],
    status: "draft",
    createdAt: new Date().toISOString()
  };
  addPost(newPost);

  return NextResponse.json({ post: newPost });
}
