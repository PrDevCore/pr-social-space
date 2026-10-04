import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts } from "@/lib/zernio";
import { listMetaAccounts } from "@/lib/meta";

// GET /api/social/accounts — accounts belonging to the current user.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metaAccounts = await listMetaAccounts(user.id);
    const profileId = await ensureProfileForUser(user.id);
    const legacyAccounts = await listAccounts(profileId);
    return NextResponse.json({ accounts: [...metaAccounts, ...legacyAccounts] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load accounts" },
      { status: 502 }
    );
  }
}
