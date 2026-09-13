import "server-only";

import type { CreatePostParams } from "@/lib/zernio";

const API_BASE = (process.env.POSTIZ_API_BASE ?? "https://api.postiz.com").replace(/\/$/, "");
const API_KEY = process.env.POSTIZ_API_KEY;
const CLIENT_ID = process.env.POSTIZ_CLIENT_ID;
const CLIENT_SECRET = process.env.POSTIZ_CLIENT_SECRET;
const POSTIZ_FRONTEND_URL = (process.env.POSTIZ_FRONTEND_URL ?? "https://platform.postiz.com").replace(/\/$/, "");

/** Explicit opt-in keeps the existing Zernio engine as the safe default. */
export const isPostizPilotEnabled = process.env.POSTIZ_ENABLED === "true";

function assertConfigured() {
  if (!API_KEY) throw new Error("POSTIZ_API_KEY is not configured.");
}

async function postizFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertConfigured();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Postiz API error ${response.status}: ${detail || response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/**
 * Provider boundary for the feature-flagged pilot. The routes should call this
 * only after the Postiz Cloud contract has been verified against the account.
 */
export async function createPostWithPostiz(params: CreatePostParams) {
  return postizFetch<{ id: string; status: string }>("/posts", {
    method: "POST",
    headers: { "Idempotency-Key": `social-hub-${crypto.randomUUID()}` },
    body: JSON.stringify({
      content: params.content,
      profileId: params.profileId,
      targets: params.targets,
      mediaUrls: params.mediaUrls,
      scheduledAt: params.scheduledAt,
      hashtags: params.hashtags,
      contentType: params.contentType,
    }),
  });
}

export function postizPilotStatus() {
  return {
    enabled: isPostizPilotEnabled,
    configured: Boolean(API_KEY || (CLIENT_ID && CLIENT_SECRET)),
    baseUrl: API_BASE,
  };
}

export function createPostizAuthorizationUrl(state: string) {
  if (!CLIENT_ID) throw new Error("POSTIZ_CLIENT_ID is not configured.");
  const params = new URLSearchParams({ client_id: CLIENT_ID, response_type: "code", state });
  return `${POSTIZ_FRONTEND_URL}/oauth/authorize?${params.toString()}`;
}

export async function exchangePostizCode(code: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Postiz OAuth is not configured.");
  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Postiz OAuth error ${response.status}: ${detail || response.statusText}`);
  }
  return response.json() as Promise<{ id: string; cus?: string; access_token: string; token_type: string }>;
}

export const postizPilot = {
  createPost: createPostWithPostiz,
};
