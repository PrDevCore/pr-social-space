import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addCompetitorSnapshot,
  createCompetitor,
  deleteCompetitor,
  listCompetitors,
  updateCompetitor,
} from "@/lib/store";

/**
 * Competitor tracking (per app user, stored in Firestore).
 *
 * GET    /api/social/competitors                 -> list
 * POST   /api/social/competitors                 -> create { platform, username, displayName?, profileUrl? }
 * PATCH  /api/social/competitors?competitorId=X  -> update fields or add a follower snapshot { followers }
 * DELETE /api/social/competitors?competitorId=X  -> delete
 */

const PLATFORMS = new Set([
  "tiktok",
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
  "reddit",
]);

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listCompetitors(user.id);
  return NextResponse.json({ competitors: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    platform?: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
  };
  if (!body.platform || !PLATFORMS.has(body.platform)) {
    return NextResponse.json({ error: "A valid platform is required." }, { status: 400 });
  }
  const username = body.username?.trim();
  if (!username) {
    return NextResponse.json({ error: "A username is required." }, { status: 400 });
  }

  const rec = await createCompetitor(user.id, {
    platform: body.platform,
    username,
    displayName: body.displayName?.trim() || undefined,
    profileUrl: body.profileUrl?.trim() || undefined,
  });
  return NextResponse.json({ competitor: rec }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("competitorId");
  if (!id) return NextResponse.json({ error: "competitorId is required." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    platform?: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
    followers?: number;
  };

  if (typeof body.followers === "number") {
    if (body.followers < 0) {
      return NextResponse.json({ error: "Followers can't be negative." }, { status: 400 });
    }
    const rec = await addCompetitorSnapshot(user.id, id, Math.round(body.followers));
    if (!rec) return NextResponse.json({ error: "Competitor not found." }, { status: 404 });
    return NextResponse.json({ competitor: rec });
  }

  const patch: { platform?: string; username?: string; displayName?: string; profileUrl?: string } = {};
  if (body.platform) {
    if (!PLATFORMS.has(body.platform)) {
      return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
    }
    patch.platform = body.platform;
  }
  if (typeof body.username === "string") {
    const u = body.username.trim();
    if (!u) return NextResponse.json({ error: "Username can't be empty." }, { status: 400 });
    patch.username = u;
  }
  if (typeof body.displayName === "string") patch.displayName = body.displayName.trim() || undefined;
  if (typeof body.profileUrl === "string") patch.profileUrl = body.profileUrl.trim() || undefined;

  const rec = await updateCompetitor(user.id, id, patch);
  if (!rec) return NextResponse.json({ error: "Competitor not found." }, { status: 404 });
  return NextResponse.json({ competitor: rec });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("competitorId");
  if (!id) return NextResponse.json({ error: "competitorId is required." }, { status: 400 });

  const ok = await deleteCompetitor(user.id, id);
  if (!ok) return NextResponse.json({ error: "Competitor not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
