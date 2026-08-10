import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  exchangeCodeForToken,
  fetchLinkedInProfile,
} from "@/lib/linkedin";
import {
  createLinkedInUser,
  createSession,
  findUserByEmail,
  findUserByLinkedInSub,
  linkLinkedInToUser,
} from "@/lib/store";

// GET /api/auth/linkedin/callback?code=...&state=...
// LinkedIn redirects here after the member approves consent. Validates the
// CSRF state, exchanges the code, provisions (or links) the user, and starts
// a session before redirecting to /dashboard (or the stored `next` target).
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("li_oauth_state")?.value;
  const next = req.cookies.get("li_oauth_next")?.value ?? "/dashboard";

  const fail = (error: string) =>
    NextResponse.redirect(`${origin}/auth/login?error=${error}`);

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("linkedin_auth_failed");
  }

  const res = NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/dashboard"}`);
  res.cookies.delete("li_oauth_state");
  res.cookies.delete("li_oauth_next");

  try {
    const accessToken = await exchangeCodeForToken({ code, origin });
    const profile = await fetchLinkedInProfile(accessToken);

    let user = await findUserByLinkedInSub(profile.sub);

    // Existing account with the same email -> link the LinkedIn identity.
    if (!user) {
      const existing = await findUserByEmail(profile.email);
      if (existing) {
        await linkLinkedInToUser(existing.id, profile.sub);
        user = existing;
      }
    }

    // First-ever LinkedIn sign-in -> auto-provision an account.
    if (!user) {
      user = await createLinkedInUser({
        sub: profile.sub,
        name: profile.name,
        email: profile.email,
      });
    }

    const sessionToken = createSessionToken();
    await createSession(user.id, sessionToken);
    res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("linkedin callback:", err);
    const resp = fail("linkedin_auth_failed");
    resp.cookies.delete("li_oauth_state");
    resp.cookies.delete("li_oauth_next");
    return resp;
  }
}