import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cancelPost,
  ensureProfileForUser,
  listScheduledPosts,
} from "@/lib/zernio";

// GET /api/social/schedules — the user's upcoming scheduled posts.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const posts = await listScheduledPosts(profileId);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load scheduled posts." },
      { status: 502 }
    );
  }
}

// DELETE /api/social/schedules { postId } — cancel a scheduled post.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.postId) {
    return NextResponse.json(
      { error: "postId is required" },
      { status: 400 }
    );
  }

  try {
    // Ownership guard: only allow cancelling posts this user can see.
    const profileId = await ensureProfileForUser(user.id);
    const owned = await listScheduledPosts(profileId);
    if (!owned.some((p) => p.id === body.postId)) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    await cancelPost(body.postId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to cancel the post." },
      { status: 502 }
    );
  }
}
