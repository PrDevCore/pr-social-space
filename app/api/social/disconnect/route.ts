import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { disconnectSocialAccount, listSocialAccounts } from "@/lib/postforme";

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
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
    const errorMessage =
      err instanceof Error && err.message.includes("POSTFORME_API_KEY")
        ? err.message
        : "Failed to disconnect account";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
