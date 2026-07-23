import { auth0 } from "./lib/auth0";
import { NextResponse } from "next/server";

export async function proxy(request: Request) {
  try {
    const authResponse = await auth0.middleware(request);
    return authResponse;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
