import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listPostsForUser } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const posts = await listPostsForUser(user.id);
    return NextResponse.json({ posts, stories: [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { postId?: string; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!body.postId || !body.content?.trim()) return NextResponse.json({ error: "postId and content are required" }, { status: 400 });
  return NextResponse.json(
    { error: "Editing published posts is not supported by the Postiz publishing adapter." },
    { status: 501 }
  );
}
