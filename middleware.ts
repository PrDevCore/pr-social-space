import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// [ Your Frontend Login ] ---> [ Auth Provider / Custom Backend ] ---> [ Redirect to /dashboard ]
//
// Every route under /dashboard and every /api/social/* route (our custom
// backend that talks to Post for Me) requires a signed-in Clerk session.
// The public webhook route is intentionally excluded since Post for Me
// calls it server-to-server, not as a logged-in user.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/social(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  } catch {
    // Avoid breaking the whole app when Clerk cannot initialize in production.
    // Let the request continue to the route handler and let the route decide
    // whether to return a 401/redirect response.
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
