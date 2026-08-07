import { NextResponse, type NextRequest } from "next/server";

// [ Your Frontend Login ] ---> [ Custom Backend ] ---> [ Redirect to /dashboard ]
//
// Every route under /dashboard and every /api/social/* route (our custom
// backend that talks to Zernio) requires a signed-in session. Presence of the
// session cookie is checked here; the session is validated against the store
// inside the routes/pages themselves (lib/auth.ts getCurrentUser).
// The public webhook route (/api/webhooks/zernio) is intentionally left out
// since Zernio calls it server-to-server, not as a logged-in user.

const SESSION_COOKIE = "session";

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/social") ||
    pathname.startsWith("/api/ai") ||
    pathname.startsWith("/api/reports") ||
    // Billing: checkout + callback need a session; the Flutterwave webhook
    // and the public pricing endpoint must stay reachable without one.
    (pathname.startsWith("/api/billing") &&
      !pathname.startsWith("/api/billing/webhook") &&
      !pathname.startsWith("/api/billing/pricing"))
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedRoute(pathname)) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
