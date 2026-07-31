# Social Hub

A social media manager: custom email/password auth, a Next.js backend, a
dashboard, and [Zernio](https://zernio.com) for actually publishing to
Instagram, TikTok, Facebook, X, LinkedIn, YouTube, Pinterest, Threads,
Reddit, Bluesky, and more.

## Workflow implemented

```
[ Your Frontend Login ]  ->  app/auth/login, app/auth/register
        |                        (custom email/password form -> /api/auth/*)
        v
[ Auth Provider / Custom Backend ]  ->  middleware.ts checks the session
        |                               cookie; /dashboard and every
        |                               /api/social/* route require it
        v
[ Redirect to /dashboard ]  ->  app/dashboard/page.tsx (server component,
        |                       reads the signed-in user id)
        v
(if social posting needed)
        v
[ Call Zernio Auth URL Endpoint ]  ->  POST /api/social/auth-url
                                       (our backend) resolves the user's
                                       Zernio profile and calls
                                       GET /v1/connect/{platform}, then the
                                       browser is redirected to the returned
                                       OAuth url.
```

Every user's social accounts live on their own Zernio **profile** (named
after their user id), so one Zernio API key can safely serve every tenant of
your app — the API key itself never touches the browser; only server routes
under `app/api/social/*` use it.

## Project layout

```
app/
  page.tsx                    Public landing / login entry
  auth/
    login/                    Custom login page + form
    register/                 Custom registration page + form
  dashboard/                  Protected dashboard (accounts + composer)
  api/auth/
    register/route.ts         Create account + start session
    login/route.ts            Verify credentials + start session
    logout/route.ts           End session
    me/route.ts               Current user
  api/social/
    auth-url/route.ts         Custom backend -> Zernio OAuth auth-url
    accounts/route.ts         List the user's connected accounts
    disconnect/route.ts       Disconnect an account (ownership-checked)
    posts/route.ts            Publish a post / list post history
    callback/route.ts         OAuth return trip (Zernio redirect target)
  api/webhooks/zernio/        account.connected webhook receiver
lib/
  auth.ts                     Password hashing (scrypt), sessions, auth guard
  zernio.ts                   Server-only Zernio API client
  store.ts                    Firebase Firestore persistence (lib/firebase.ts)
components/                   Dashboard UI (connect, compose, account cards)
middleware.ts                 Session route protection
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - **Firebase**: enable Cloud Firestore, then in Firebase console ->
     Project settings -> Service accounts -> "Generate new private key".
     Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
     `FIREBASE_PRIVATE_KEY` (on one line with `\n` escapes in `.env` files).
   - `ZERNIO_API_KEY` from your [Zernio dashboard](https://zernio.com/dashboard/api-keys).
   - Set `APP_URL` to your app's origin (e.g. `http://localhost:3000`).
   - No Clerk / auth provider keys needed — registration and login are
     handled in-app.
3. In the Zernio dashboard, create a profile and connect the social accounts
   you want to support (or let users connect them from the app UI).
4. (Optional) In the Zernio dashboard, add a webhook pointing at
   `https://yourdomain.com/api/webhooks/zernio` subscribed to
   `account.connected`, and set `ZERNIO_WEBHOOK_SECRET` to the same secret.
5. `npm run dev` and open `http://localhost:3000`.

## Storage (Firebase Firestore)

`lib/store.ts` persists everything in **Firebase Firestore** via the Admin
SDK (`firebase-admin`), using the same function signatures a plain database
would expose:

- `users[userId]` — accounts (name, email, scrypt password hash)
- `sessions[token]` — session cookies (7-day expiry)
- `posts[postId]` — post history
- `connectedAccountEvents` — `account.connected` webhook events
- `profiles[userId]` — userId -> Zernio profileId mapping

Because every route and component calls `lib/store.ts`, swapping the backend
(Firestore -> Prisma/Postgres, etc.) only touches this one file.

## Notes

- Passwords are hashed with `scrypt` (per-user salt) and never stored in
  plain text. Sessions are opaque random tokens in an HTTP-only cookie.
- Zernio remains the source of truth for OAuth tokens and connected account
  status — this app never stores access tokens itself.
- Every `/api/social/*` route re-verifies that a `socialAccountId` belongs to
  the requesting user (via their Zernio profile) before allowing a disconnect
  or a post, so users can never act on someone else's connected account.
- Zernio publishes immediately when `publishNow` is set, or on `scheduledFor`
  when a schedule time is provided.
