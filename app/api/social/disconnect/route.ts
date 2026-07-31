import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  disconnectAccount,
  ensureProfileForUser,
  listAccounts,
} from "@/lib/zernio";

// POST /api/social/disconnect { accountId }
// We never trust an accountId from the client blindly — we re-fetch the
// user's own accounts from Zernio (scoped to their profile) and only
// disconnect if it actually belongs to them.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = (await req.json()) as { accountId?: string };
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);
    const accounts = await listAccounts(profileId);
    const owns = accounts.some((a) => a.id === accountId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await disconnectAccount(accountId);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 502 }
    );
  }
}
