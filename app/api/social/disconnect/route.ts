import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { disconnectSocialAccount, listSocialAccounts } from "@/lib/postforme";

// POST /api/social/disconnect { accountId }
// We never trust an accountId from the client blindly — we re-fetch the
// user's own accounts from Post for Me (scoped by external_id) and only
// disconnect if it actually belongs to them.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = (await req.json()) as { accountId?: string };
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const { data } = await listSocialAccounts(userId);
    const owns = data.some((a) => a.id === accountId);
    if (!owns) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await disconnectSocialAccount(accountId);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 502 }
    );
  }
}
