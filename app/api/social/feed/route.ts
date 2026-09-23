import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts, listInstagramStories, listPosts, updatePost } from "@/lib/zernio";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profileId = await ensureProfileForUser(user.id);
    const accounts = await listAccounts(profileId);
    const posts = await listPosts(profileId, 500);
    const stories: { accountId: string; accountName?: string; stories: Awaited<ReturnType<typeof listInstagramStories>> }[] = [];
    for (const account of accounts.filter((a) => a.platform === "instagram")) {
      try {
        const items = await listInstagramStories(account.id);
        if (items.length) stories.push({ accountId: account.id, accountName: account.display_name ?? account.username, stories: items });
      } catch (err) { console.error("instagram stories:", err); }
    }
    return NextResponse.json({ posts, stories });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load live feed." }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { postId?: string; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!body.postId || !body.content?.trim()) return NextResponse.json({ error: "postId and content are required" }, { status: 400 });
  try {
    const profileId = await ensureProfileForUser(user.id);
    const posts = await listPosts(profileId, 500);
    if (!posts.some((post) => post.id === body.postId)) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    await updatePost(body.postId, { content: body.content.trim() });
    return NextResponse.json({ ok: true, content: body.content.trim() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to edit published post" }, { status: 502 });
  }
}
