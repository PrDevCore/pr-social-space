import { NextRequest, NextResponse } from "next/server";

// Post for Me always redirects here after the user finishes (or abandons)
// the OAuth screen, appending: provider, projectId, isSuccess, accountIds,
// failedAccountIds, error. We just forward the relevant bits onto the
// dashboard as query params so the UI can show a success/error toast.
// (Only used for White Label projects — Quickstart projects configure this
// redirect in the Post for Me dashboard settings instead.)
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
  dashboardUrl.searchParams.set("provider", params.get("provider") ?? "");
  dashboardUrl.searchParams.set("isSuccess", params.get("isSuccess") ?? "");
  if (params.get("error")) {
    dashboardUrl.searchParams.set("error", params.get("error")!);
  }
  if (params.get("accountIds")) {
    dashboardUrl.searchParams.set("accountIds", params.get("accountIds")!);
  }

  return NextResponse.redirect(dashboardUrl);
}
