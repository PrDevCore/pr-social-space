import { NextRequest, NextResponse } from "next/server";
import { connectMetaAccounts } from "@/lib/meta";

// Zernio (standard, non-headless connect flow) redirects the browser back
// here after the user finishes (or abandons) the OAuth screen, appending:
//   success: ?connected=<platform>&profileId=..&accountId=..&username=..
//   failure: ?error=...
// We just forward the relevant bits onto the dashboard as query params so
// the UI can show a success/error toast.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
  const connected = params.get("connected");
  const error = params.get("error");
  const state = params.get("state");
  const code = params.get("code");
  const savedState = req.cookies.get("meta_oauth_state")?.value;

  if (code && state && savedState === state) {
    try {
      const payload = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { userId?: string };
      if (!payload.userId) throw new Error("Invalid OAuth state");
      await connectMetaAccounts(payload.userId, code, `${process.env.APP_URL ?? req.nextUrl.origin}/api/social/callback`);
      dashboardUrl.searchParams.set("provider", "meta");
      dashboardUrl.searchParams.set("isSuccess", "true");
    } catch (err) {
      console.error("Meta callback:", err);
      dashboardUrl.searchParams.set("isSuccess", "false");
      dashboardUrl.searchParams.set("error", "Meta connection failed.");
    }
  } else if (connected) {
    dashboardUrl.searchParams.set("provider", connected);
    dashboardUrl.searchParams.set("isSuccess", "true");
  } else if (error) {
    dashboardUrl.searchParams.set("isSuccess", "false");
    dashboardUrl.searchParams.set("error", error);
  } else {
    dashboardUrl.searchParams.set("isSuccess", "false");
    dashboardUrl.searchParams.set("error", "Unexpected callback from Zernio.");
  }

  return NextResponse.redirect(dashboardUrl);
}
