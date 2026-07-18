import "server-only";

/**
 * Thin server-side client for the Post for Me API.
 * https://api.postforme.dev/docs
 *
 * This file is the ONLY place the POSTFORME_API_KEY is used. It must never
 * be imported from a client component. All routes under app/api/social/*
 * (our "custom backend") call through here on behalf of the signed-in
 * Clerk user, scoping every request with external_id = clerk userId.
 */

const API_BASE = process.env.POSTFORME_API_BASE ?? "https://api.postforme.dev";
const API_KEY = process.env.POSTFORME_API_KEY;

function assertConfigured() {
  if (!API_KEY) {
    throw new Error(
      "POSTFORME_API_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
}

async function pfmFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  assertConfigured();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Post for Me API error ${res.status} on ${path}: ${body || res.statusText}`
    );
  }

  // Some endpoints (e.g. disconnect) may return 204 with no body.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky";

export interface SocialAccount {
  id: string; // e.g. "spc_12345"
  platform: SocialPlatform;
  external_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  status?: string;
}

export interface CreateAuthUrlParams {
  platform: SocialPlatform;
  externalId: string;
  /** Only used for White Label projects. Quickstart projects configure the
   * redirect URL in the Post for Me dashboard and must omit this field. */
  redirectUrlOverride?: string;
  platformData?: Record<string, unknown>;
  permissions?: string[];
}

/**
 * [ Call Post for Me Auth URL Endpoint ]
 * POST /v1/social-accounts/auth-url
 * Returns a URL to send the user to so they can grant OAuth access.
 */
export async function createAuthUrl(params: CreateAuthUrlParams) {
  const isWhiteLabel = process.env.POSTFORME_PROJECT_MODE === "white_label";

  const body: Record<string, unknown> = {
    platform: params.platform,
    external_id: params.externalId,
  };

  if (params.platformData) body.platform_data = params.platformData;
  if (params.permissions) body.permissions = params.permissions;

  // Quickstart projects must NOT send redirect_url_override — the redirect
  // target is configured globally in the Post for Me dashboard instead.
  if (isWhiteLabel && params.redirectUrlOverride) {
    body.redirect_url_override = params.redirectUrlOverride;
  }

  return pfmFetch<{ url: string }>("/v1/social-accounts/auth-url", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /v1/social-accounts?external_id=... — accounts owned by one user. */
export async function listSocialAccounts(externalId: string) {
  const qs = new URLSearchParams({ external_id: externalId });
  return pfmFetch<{ data: SocialAccount[] }>(
    `/v1/social-accounts?${qs.toString()}`
  );
}

/** POST /v1/social-accounts/{id}/disconnect */
export async function disconnectSocialAccount(accountId: string) {
  return pfmFetch<{ id: string; status: string }>(
    `/v1/social-accounts/${accountId}/disconnect`,
    { method: "POST" }
  );
}

export interface CreatePostParams {
  caption: string;
  socialAccountIds: string[];
  mediaUrls?: string[];
  scheduledAt?: string; // ISO 8601, omit to publish immediately
}

/** POST /v1/social-posts — publish (or schedule) content to one or more accounts. */
export async function createSocialPost(params: CreatePostParams) {
  const body: Record<string, unknown> = {
    caption: params.caption,
    social_accounts: params.socialAccountIds,
  };

  if (params.mediaUrls?.length) {
    body.media = params.mediaUrls.map((url) => ({ url }));
  }
  if (params.scheduledAt) {
    body.scheduled_at = params.scheduledAt;
  }

  return pfmFetch<{
    id: string;
    status: "processing" | "processed" | "failed";
  }>("/v1/social-posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
