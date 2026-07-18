import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listSocialAccounts } from "@/lib/postforme";

// GET /api/social/accounts — accounts belonging to the current Clerk user.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data } = await listSocialAccounts(userId);
    return NextResponse.json({ accounts: data });
  } catch (err) {
    console.error(err);
    const errorMessage =
      err instanceof Error && err.message.includes("POSTFORME_API_KEY")
        ? err.message
        : "Failed to load accounts";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
