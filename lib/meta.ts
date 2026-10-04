import "server-only";
import { randomUUID } from "crypto";
import { getSocialAccountsForUser, saveSocialAccount, removeSocialAccount, type StoredSocialAccount } from "@/lib/store";

const GRAPH = "https://graph.facebook.com/v21.0";
const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

export type MetaPlatform = "facebook" | "instagram";
export type MetaAccount = StoredSocialAccount & { platform: MetaPlatform };

function requireConfig() {
  if (!APP_ID || !APP_SECRET) throw new Error("Meta app credentials are not configured.");
}

async function graph<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GRAPH}${path}`, { ...init, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || data.error) throw new Error(`Meta API error: ${data.error?.message ?? res.statusText}`);
  return data;
}

export function createMetaAuthUrl(state: string, redirectUri: string) {
  requireConfig();
  const qs = new URLSearchParams({
    client_id: APP_ID!, redirect_uri: redirectUri, state, response_type: "code",
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${qs}`;
}

export async function connectMetaAccounts(userId: string, code: string, redirectUri: string) {
  requireConfig();
  const token = await graph<{ access_token: string }>(`/oauth/access_token?${new URLSearchParams({ client_id: APP_ID!, client_secret: APP_SECRET!, redirect_uri: redirectUri, code })}`);
  const pages = await graph<{ data: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }> }>(`/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(token.access_token)}`);
  for (const page of pages.data ?? []) {
    await saveSocialAccount(userId, { id: `meta:facebook:${page.id}`, platform: "facebook", username: page.name, display_name: page.name, accessToken: page.access_token, externalId: page.id });
    if (page.instagram_business_account?.id) {
      const ig = await graph<{ username?: string; name?: string }>(`/${page.instagram_business_account.id}?fields=username,name&access_token=${encodeURIComponent(page.access_token)}`);
      await saveSocialAccount(userId, { id: `meta:instagram:${page.instagram_business_account.id}`, platform: "instagram", username: ig.username, display_name: ig.name ?? ig.username, accessToken: page.access_token, externalId: page.instagram_business_account.id, pageId: page.id });
    }
  }
  return pages.data?.length ?? 0;
}

export async function listMetaAccounts(userId: string) {
  return (await getSocialAccountsForUser(userId)).filter((a) => a.platform === "facebook" || a.platform === "instagram");
}

export async function publishMetaPost(userId: string, input: { accountIds: string[]; content: string; mediaUrls?: string[]; scheduledAt?: string }) {
  const accounts = await listMetaAccounts(userId);
  const selected = accounts.filter((a) => input.accountIds.includes(a.id));
  if (selected.length !== input.accountIds.length) throw new Error("One or more social accounts are not connected to this user.");
  if (selected.some((a) => a.platform === "instagram") && input.scheduledAt) throw new Error("Instagram Graph API does not support scheduled publishing; publish immediately or schedule Facebook only.");
  const results: Array<{ id: string; status: string }> = [];
  for (const account of selected) {
    if (account.platform === "facebook") {
      const body = new URLSearchParams({ message: input.content, access_token: account.accessToken });
      if (input.mediaUrls?.[0]) body.set("link", input.mediaUrls[0]);
      if (input.scheduledAt) { body.set("published", "false"); body.set("scheduled_publish_time", String(Math.floor(new Date(input.scheduledAt).getTime() / 1000))); }
      const result = await graph<{ id: string }>(`/${account.externalId}/feed`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      results.push({ id: result.id, status: input.scheduledAt ? "scheduled" : "published" });
    } else {
      if (!input.mediaUrls?.[0]) throw new Error("Instagram publishing requires an image or video URL.");
      const params = new URLSearchParams({ caption: input.content, image_url: input.mediaUrls[0], access_token: account.accessToken });
      const container = await graph<{ id: string }>(`/${account.externalId}/media`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
      const published = await graph<{ id: string }>(`/${account.externalId}/media_publish`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ creation_id: container.id, access_token: account.accessToken }) });
      results.push({ id: published.id, status: "published" });
    }
  }
  return results;
}

export { removeSocialAccount };
export const metaId = () => randomUUID();
export type { StoredSocialAccount };
