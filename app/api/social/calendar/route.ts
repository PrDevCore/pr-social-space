import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureProfileForUser,
  getNextQueueSlot,
  getQueueSlots,
  listScheduledPosts,
  updatePost,
} from "@/lib/zernio";

/**
 * Visual content calendar.
 *
 * GET   /api/social/calendar            -> { posts, queueSlots, nextSlot }
 * PATCH   /api/social/calendar            -> { postId, scheduledFor?, content? } (edit/reschedule)
 */

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profileId = await ensureProfileForUser(user.id);
    const [posts, queueSlots, nextSlot] = await Promise.all([
      listScheduledPosts(profileId),
      getQueueSlots(profileId).catch(() => []),
      getNextQueueSlot(profileId).catch(() => null),
    ]);
    return NextResponse.json({ posts, queueSlots, nextSlot });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load calendar" },
      { status: 502 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { postId?: string; scheduledFor?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.postId || (!body.scheduledFor && !body.content?.trim())) {
    return NextResponse.json(
      { error: "postId and either scheduledFor or content are required" },
      { status: 400 }
    );
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const owned = await listScheduledPosts(profileId);
    if (!owned.some((p) => p.id === body.postId)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const scheduledFor = body.scheduledFor
      ? new Date(body.scheduledFor).toISOString()
      : undefined;
    await updatePost(body.postId, {
      content: body.content?.trim(),
      scheduledFor,
      timezone: scheduledFor ? "UTC" : undefined,
    });
    return NextResponse.json({ ok: true, scheduledFor, content: body.content?.trim() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to reschedule post" }, { status: 502 });
  }
}
