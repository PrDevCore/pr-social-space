# Social Hub

A social media manager: Clerk for auth, a custom Next.js backend, a
dashboard, and [Post for Me](https://www.postforme.dev) for actually
publishing to TikTok, Instagram, Facebook, X, LinkedIn, YouTube, Pinterest,
Threads, and Bluesky.

## Workflow implemented

```
[ Your Frontend Login ]  ->  app/page.tsx, app/sign-in, app/sign-up
        |
        v
[ Auth Provider / Custom Backend ]  ->  Clerk verifies the session;
        |                               middleware.ts protects /dashboard
        |                               and every /api/social/* route
        v
[ Redirect to /dashboard ]  ->  app/dashboard/page.tsx (server component,
        |                       reads the signed-in Clerk userId)
        v
(if social posting needed)
        v
[ Call Post for Me Auth URL Endpoint ]  ->  POST /api/social/auth-url
                                             (our backend) calls
                                             POST /v1/social-accounts/auth-url
                                             (Post for Me) with
                                             external_id = Clerk userId,
                                             then the browser is redirected
                                             to the returned OAuth url.
```

Every user's social accounts are scoped with `external_id = <Clerk userId>`,
so one Post for Me project can safely serve every tenant of your app (see
Post for Me's "Multi-User Applications" guide) — the API key itself never
touches the browser; only server routes under `app/api/social/*` use it.

## Project layout

```
app/
  page.tsx                    Public landing / login entry
  sign-in, sign-up/           Clerk hosted auth UI
  dashboard/                  Protected dashboard (accounts + composer)
  api/social/
    auth-url/route.ts         Custom backend -> Post for Me auth-url
    accounts/route.ts         List the user's connected accounts
    disconnect/route.ts       Disconnect an account (ownership-checked)
    posts/route.ts            Publish a post / list post history
    callback/route.ts         OAuth return trip (White Label projects only)
  api/webhooks/postforme/     social.account.created webhook receiver
lib/
  postforme.ts                Server-only Post for Me API client
  store.ts                    Custom backend persistence (swap for a real DB)
components/                   Dashboard UI (connect, compose, account cards)
middleware.ts                 Clerk route protection
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` from
     [clerk.com](https://clerk.com) (create an application, enable email or
     social sign-in).
   - `POSTFORME_API_KEY` from your [Post for Me](https://app.postforme.dev)
     project settings.
   - Set `POSTFORME_PROJECT_MODE=quickstart` if you're using Post for Me's
     shared developer credentials, or `white_label` if you brought your own
     platform developer apps.
3. In the Post for Me dashboard, enable the platforms you want to support.
   - **Quickstart projects:** set your Project Redirect URL in Post for Me's
     dashboard settings to `http://localhost:3000/dashboard` (or your prod
     domain) — do not rely on `redirect_url_override`.
   - **White Label projects:** the app already sends
     `redirect_url_override` pointing at `/api/social/callback`, which
     forwards the result to `/dashboard`.
4. (Optional) In Post for Me, add a webhook pointing at
   `https://yourdomain.com/api/webhooks/postforme` subscribed to
   `social.account.created`, and set `POSTFORME_WEBHOOK_SECRET`.
5. `npm run dev` and open `http://localhost:3000`.

## Swapping the demo database

`lib/store.ts` uses a JSON file (`data/db.json`) purely so the project runs
with zero external dependencies. In production, replace it with
Prisma + Postgres (or your DB of choice) — every exported function
(`recordPost`, `listPostsForUser`, `recordAccountConnected`) is written as
the seam to do that without touching any route or component.

## Notes

- Post for Me remains the source of truth for OAuth tokens and connected
  account status — this app never stores access tokens itself.
- Every `/api/social/*` route re-verifies that a `social_account_id`
  belongs to the requesting Clerk user (via `external_id`) before allowing
  a disconnect or a post, so users can never act on someone else's
  connected account.
