import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { postsStore, addPost } from "@/lib/socialspace-store";
import type { Post } from "@/lib/socialspace-types";

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caption, platforms, mediaUrls, scheduledAt } = await req.json();
  if (!caption || !platforms?.length || !scheduledAt) {
    return NextResponse.json({ error: "caption, platforms, and scheduledAt are required" }, { status: 400 });
  }

  const newPost: Post = {
    id: "sched_" + Date.now(),
    caption,
    platforms,
    mediaUrls: mediaUrls || [],
    status: "scheduled",
    scheduledAt,
    createdAt: new Date().toISOString()
  };
  addPost(newPost);

  return NextResponse.json({ post: newPost });
}
