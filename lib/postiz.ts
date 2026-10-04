import "server-only";

import type { CreatePostParams } from "@/lib/zernio";

// POSTIZ_API_BASE should point to the self-hosted instance's public API, for
// example https://social.example.com/api/public/v1.
const API_BASE = (process.env.POSTIZ_API_BASE ?? "http://localhost:5000/api/public/v1").replace(/\/$/, "");
const API_KEY = process.env.POSTIZ_API_KEY;
const CLIENT_ID = process.env.POSTIZ_CLIENT_ID;
const CLIENT_SECRET = process.env.POSTIZ_CLIENT_SECRET;
const POSTIZ_FRONTEND_URL = (process.env.POSTIZ_FRONTEND_URL ?? "https://platform.postiz.com").replace(/\/$/, "");

/** Self-hosted Postiz is the primary publishing and scheduling engine. */
export const isPostizEnabled = process.env.POSTIZ_ENABLED !== "false";

function assertConfigured() {
  if (!API_KEY) throw new Error("POSTIZ_API_KEY is not configured.");
}

async function postizFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertConfigured();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: API_KEY!,
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
  const scheduled = Boolean(params.scheduledAt);
  const content = [params.content, ...(params.hashtags ?? []).map((tag) => `#${tag.replace(/^#/, "")}`)].join(" ");

  return postizFetch<{ id: string; status?: string }>("/posts", {
    method: "POST",
    headers: { "Idempotency-Key": `social-hub-${crypto.randomUUID()}` },
    body: JSON.stringify({
      type: scheduled ? "schedule" : "now",
      date: params.scheduledAt ?? new Date().toISOString(),
      shortLink: false,
      tags: [],
      posts: params.targets.map((target) => ({
        integration: { id: target.accountId },
        value: [{ content }],
        settings: { type: target.platform },
      })),
      media: (params.mediaUrls ?? []).map((url) => ({ path: url, id: url })),
    }),
  }).then((result) => ({ id: result.id, status: result.status ?? (scheduled ? "scheduled" : "published") }));
}

export function postizPilotStatus() {
  return {
    enabled: isPostizEnabled,
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
