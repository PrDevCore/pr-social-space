import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { postsStore } from "@/lib/socialspace-store";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idx = postsStore.findIndex((p) => p.id === id);
  if (idx !== -1) postsStore.splice(idx, 1);

  return NextResponse.json({ success: true, deletedId: id });
}
