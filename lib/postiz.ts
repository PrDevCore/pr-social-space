import "server-only";

import type { CreatePostParams } from "@/lib/zernio";

const API_BASE = (process.env.POSTIZ_API_BASE ?? "https://api.postiz.com").replace(/\/$/, "");
const API_KEY = process.env.POSTIZ_API_KEY;

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
    configured: Boolean(API_KEY),
    baseUrl: API_BASE,
  };
}

export const postizPilot = {
  createPost: createPostWithPostiz,
};
