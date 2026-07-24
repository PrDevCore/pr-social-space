import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { postsStore } from "@/lib/socialspace-store";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ posts: postsStore });
}
