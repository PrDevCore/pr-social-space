import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listSocialAccounts } from "@/lib/postforme";

export async function GET() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
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
