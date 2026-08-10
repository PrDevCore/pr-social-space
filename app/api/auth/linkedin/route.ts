import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, linkedinConfigured } from "@/lib/linkedin";

// GET /api/auth/linkedin[?next=/...]
// Starts LinkedIn "Sign in with LinkedIn". Redirects the browser to LinkedIn,
// storing a CSRF `state` (and the `next` target) in short-lived HttpOnly
// cookies so the callback can round-trip them.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!linkedinConfigured()) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=linkedin_not_configured`
    );
  }

  const next = req.nextUrl.searchParams.get("next");
  const state = randomBytes(24).toString("hex");

  const authUrl = buildAuthorizeUrl({ origin, state });
  if (!authUrl) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=linkedin_not_configured`
    );
  }

  const res = NextResponse.redirect(authUrl);
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  };
  res.cookies.set("li_oauth_state", state, cookieOpts);
  if (next && next.startsWith("/")) {
    res.cookies.set("li_oauth_next", next, cookieOpts);
  }
  return res;
}