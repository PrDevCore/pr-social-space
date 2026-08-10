import "server-only";

/**
 * Minimal server-side client for LinkedIn "Sign in with LinkedIn using
 * OpenID Connect". Server-only — credentials never leave the server.
 *
 * Flow (hosted by app/api/auth/linkedin + /callback):
 *   1. GET /api/auth/linkedin -> redirect to LinkedIn's authorization URL.
 *   2. LinkedIn bounces back to /api/auth/linkedin/callback?code=...&state=...
 *   3. Exchange `code` for an access token, then call the userinfo endpoint
 *      to fetch the member's OpenID claims (sub, name, email).
 *
 * NOTE: LinkedIn requires a registered redirect_uri that matches exactly.
 * Provide LINKEDIN_REDIRECT_URI in env, otherwise it defaults to
 * `<APP_URL|origin>/api/auth/linkedin/callback`.
 */

export const LINKEDIN_AUTH_BASE = "https://www.linkedin.com/oauth/v2";
const USERINFO_ENDPOINT = "https://api.linkedin.com/v2/userinfo";

export interface LinkedInProfile {
  sub: string;
  name: string;
  email: string;
  emailVerified: boolean;
  picture?: string;
}

export function linkedinConfigured(): boolean {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
  );
}

export function getLinkedInRedirectUri(origin: string): string {
  return (
    process.env.LINKEDIN_REDIRECT_URI ?? `${origin}/api/auth/linkedin/callback`
  );
}

/** Build the LinkedIn authorization URL the browser should be redirected to. */
export function buildAuthorizeUrl(opts: {
  origin: string;
  state: string;
}): string | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getLinkedInRedirectUri(opts.origin),
    scope: "openid profile email",
    state: opts.state,
  });
  return `${LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
}

/** Exchange the authorization `code` for an access token. */
export async function exchangeCodeForToken(opts: {
  code: string;
  origin: string;
}): Promise<string> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth is not configured.");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: getLinkedInRedirectUri(opts.origin),
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`LinkedIn token exchange failed (${res.status}).`);
  }
  return data.access_token as string;
}

/** Fetch the member's OpenID claims using the access token. */
export async function fetchLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.sub) {
    throw new Error(`LinkedIn userinfo failed (${res.status}).`);
  }
  const email =
    typeof data.email === "string" && data.email.trim()
      ? data.email.trim()
      : `${data.sub}@linkedin.oauth`;
  return {
    sub: data.sub,
    name: data.name ?? "LinkedIn member",
    email,
    emailVerified: Boolean(data.email_verified),
    picture: typeof data.picture === "string" ? data.picture : undefined,
  };
}