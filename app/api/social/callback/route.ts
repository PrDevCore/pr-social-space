import { NextRequest, NextResponse } from "next/server";

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

  if (connected) {
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
