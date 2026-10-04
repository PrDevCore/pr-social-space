import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listPostsForUser, updatePostStatus } from "@/lib/store";

// GET /api/social/schedules — the user's upcoming scheduled posts.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = (await listPostsForUser(user.id)).filter((post) => post.status === "scheduled");
    return NextResponse.json({ posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load scheduled posts." }, { status: 500 });
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
    const owned = await listPostsForUser(user.id);
    const post = owned.find((item) => item.id === body.postId && item.status === "scheduled");
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await updatePostStatus(body.postId, "cancelled", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to cancel the post." }, { status: 500 });
  }
}
