import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPostizAuthorizationUrl } from "@/lib/postiz";

const STATE_COOKIE = "postiz_oauth_state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(createPostizAuthorizationUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}

export const dynamic = "force-dynamic";
