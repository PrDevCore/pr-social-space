import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exchangePostizCode } from "@/lib/postiz";

const STATE_COOKIE = "postiz_oauth_state";
const TOKEN_COOKIE = "postiz_access_token";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const redirect = new URL("/profile?postiz=", url.origin);

  if (!user) {
    redirect.searchParams.set("postiz", "unauthorized");
    return NextResponse.redirect(redirect);
  }
  if (error) {
    redirect.searchParams.set("postiz", "denied");
    return NextResponse.redirect(redirect);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    redirect.searchParams.set("postiz", "invalid_state");
    return NextResponse.redirect(redirect);
  }

  try {
    const token = await exchangePostizCode(code);
    const response = NextResponse.redirect(new URL("/profile?postiz=connected", url.origin));
    response.cookies.set(TOKEN_COOKIE, token.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (cause) {
    console.error("[postiz] OAuth callback failed", cause);
    redirect.searchParams.set("postiz", "error");
    return NextResponse.redirect(redirect);
  }
}

export const dynamic = "force-dynamic";
