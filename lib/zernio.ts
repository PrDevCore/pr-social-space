import "server-only";
import { randomUUID } from "crypto";
import { getProfileForUser, setProfileForUser } from "@/lib/store";

/**
 * Thin server-side client for the Zernio API.
 * https://zernio.com/llms.txt | https://zernio.com/openapi.yaml
 *
 * This file is the ONLY place the ZERNIO_API_KEY is used. It must never be
 * imported from a client component. All routes under app/api/social/*
 * (our "custom backend") call through here on behalf of the signed-in
 * user.
 *
 * Multi-user scoping: Zernio organises connected accounts into *profiles*.
 * Each app user gets their own profile (named after their user id) so one
 * Zernio API key can safely serve every tenant of the app. The
 * userId <-> profileId mapping is cached in our own store (lib/store.ts).
 */

const API_BASE = process.env.ZERNIO_API_BASE ?? "https://zernio.com/api/v1";
const API_KEY = process.env.ZERNIO_API_KEY;

function assertConfigured() {
  if (!API_KEY) {
    throw new Error(
      "ZERNIO_API_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
}

async function zernioFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      `Zernio API error ${res.status} on ${path}: ${body || res.statusText}`
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "reddit";

export interface SocialAccount {
  id: string; // Zernio account id
  platform: SocialPlatform;
  username?: string;
  display_name?: string;
  avatar_url?: string; // platform profile picture URL (may be null on some platforms)
  profile_url?: string; // link to the account's profile on the platform
  followers_count?: number;
}

/* ------------------------------- Profiles ------------------------------- */

const PROFILE_DESCRIPTION_PREFIX = "Social Hub profile for user ";

function profileNameForUser(userId: string) {
  return `User ${userId.slice(0, 8)}`;
}

function profileDescriptionForUser(userId: string) {
  return `${PROFILE_DESCRIPTION_PREFIX}${userId}`;
}

interface ZernioProfile {
  _id: string;
  name: string;
  description?: string;
}

async function findProfileByDescription(
  description: string
): Promise<ZernioProfile | undefined> {
  const { profiles } = await zernioFetch<{ profiles: ZernioProfile[] }>(
    "/profiles"
  );
  return profiles.find((p) => p.description === description);
}

/**
 * Resolve (creating if needed) the Zernio profile owned by this user.
 * Used by every /api/social/* route to scope requests to the user.
 */
export async function ensureProfileForUser(userId: string): Promise<string> {
  const cached = await getProfileForUser(userId);
  if (cached) return cached;

  const description = profileDescriptionForUser(userId);

  // Recover a profile created by an earlier run (e.g. store was reset).
  const existing = await findProfileByDescription(description);
  if (existing) {
    await setProfileForUser(userId, existing._id);
    return existing._id;
  }

  const { profile } = await zernioFetch<{ profile: ZernioProfile }>(
    "/profiles",
    {
      method: "POST",
      headers: { "Idempotency-Key": `social-hub-profile-${userId}` },
      body: JSON.stringify({
        name: profileNameForUser(userId),
        description,
        color: "#ffeda0",
      }),
    }
  );

  await setProfileForUser(userId, profile._id);
  return profile._id;
}

/**
 * Reverse mapping used by the account.connected webhook: a Zernio profileId
 * -> the user id encoded in the profile description.
 */
export async function getUserIdForProfileId(
  profileId: string
): Promise<string | null> {
  const { profile } = await zernioFetch<{ profile: ZernioProfile }>(
    `/profiles/${profileId}`
  );
  if (!profile.description?.startsWith(PROFILE_DESCRIPTION_PREFIX)) return null;
  return profile.description.slice(PROFILE_DESCRIPTION_PREFIX.length);
}

/* ---------------------------- OAuth connect ----------------------------- */

/** GET /v1/connect/{platform}?profileId=..&redirect_url=.. */
export async function createAuthUrl(params: {
  platform: SocialPlatform;
  profileId: string;
  redirectUrl: string;
}) {
  const qs = new URLSearchParams({
    profileId: params.profileId,
    redirect_url: params.redirectUrl,
  });
  return zernioFetch<{ authUrl: string; state?: string }>(
    `/connect/${params.platform}?${qs.toString()}`
  );
}

/* ------------------------------- Accounts ------------------------------- */

interface ZernioAccount {
  _id: string;
  platform: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  profileUrl?: string;
  followersCount?: number;
  isActive?: boolean;
}

function mapAccount(a: ZernioAccount): SocialAccount {
  return {
    id: a._id,
    platform: a.platform as SocialPlatform,
    username: a.username,
    display_name: a.displayName,
    avatar_url: a.profilePicture,
    profile_url: a.profileUrl,
    followers_count: a.followersCount,
  };
}

/** GET /v1/accounts?profileId=.. — accounts owned by one user's profile. */
export async function listAccounts(profileId: string) {
  const qs = new URLSearchParams({ profileId });
  const { accounts } = await zernioFetch<{ accounts: ZernioAccount[] }>(
    `/accounts?${qs.toString()}`
  );
  return accounts.map(mapAccount);
}

/** DELETE /v1/accounts/{accountId} */
export async function disconnectAccount(accountId: string) {
  return zernioFetch<{ message?: string }>(`/accounts/${accountId}`, {
    method: "DELETE",
  });
}

/* -------------------------------- Posts --------------------------------- */

function guessMediaType(url: string): "image" | "video" {
  return /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(url) ? "video" : "image";
}

export interface CreatePostParams {
  content: string;
  profileId: string;
  /** The connected accounts to publish to, with their platforms. */
  targets: Array<{ accountId: string; platform: SocialPlatform }>;
  mediaUrls?: string[];
  scheduledAt?: string; // ISO 8601, omit to publish immediately
  /** Hashtags to publish alongside the post (without the leading #). */
  hashtags?: string[];
}

/** POST /v1/posts — publish (or schedule) content to one or more accounts. */
export async function createPost(params: CreatePostParams) {
  const body: Record<string, unknown> = {
    content: params.content,
    profileId: params.profileId,
    platforms: params.targets.map((t) => ({
      platform: t.platform,
      accountId: t.accountId,
    })),
  };

  if (params.mediaUrls?.length) {
    body.mediaItems = params.mediaUrls.map((url) => ({
      type: guessMediaType(url),
      url,
    }));
  }
  if (params.hashtags?.length) {
    body.hashtags = params.hashtags;
  }
  if (params.scheduledAt) {
    body.scheduledFor = params.scheduledAt;
    body.timezone = "UTC";
  } else {
    body.publishNow = true;
  }

  // Idempotency: a retry with the same x-request-id returns the original
  // post instead of double-publishing (see Zernio docs).
  const { post } = await zernioFetch<{
    post: { _id: string; status: string };
  }>("/posts", {
    method: "POST",
    headers: { "x-request-id": randomUUID() },
    body: JSON.stringify(body),
  });

  return { id: post._id, status: post.status };
}

/* -------------------------------- Media --------------------------------- */

/**
 * Get a presigned URL to upload media directly to Zernio's storage.
 * The browser PUTs the file bytes straight to `uploadUrl` (CORS-enabled),
 * then uses `publicUrl` in post mediaItems.
 */
export async function presignMedia(input: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  return zernioFetch<{ uploadUrl: string; publicUrl: string }>(
    "/media/presign",
    {
      method: "POST",
      body: JSON.stringify({
        filename: input.filename,
        contentType: input.contentType,
      }),
    }
  );
}

/* ------------------------------ Live feeds ------------------------------ */

export interface FeedMedia {
  type: string;
  url: string;
  thumbnail?: string;
}

export interface FeedPostPlatform {
  platform: SocialPlatform;
  accountId: string;
  accountName?: string;
  status: string;
  publishedUrl?: string;
}

export interface FeedPost {
  id: string;
  content: string;
  status: string;
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  media: FeedMedia[];
  platforms: FeedPostPlatform[];
}

export interface Story {
  id: string;
  mediaType: string;
  mediaUrl?: string;
  permalink?: string;
  thumbnailUrl?: string;
  timestamp?: string;
}

function mapPlatformTarget(t: {
  platform: string;
  accountId: string | { _id: string; username?: string; displayName?: string };
  status?: string;
  publishedAt?: string;
  platformPostUrl?: string;
}): FeedPostPlatform {
  const isObject = typeof t.accountId === "object" && t.accountId !== null;
  const embedded = isObject
    ? (t.accountId as { _id: string; username?: string; displayName?: string })
    : null;
  return {
    platform: t.platform as SocialPlatform,
    accountId: embedded ? embedded._id : (t.accountId as string),
    accountName: embedded?.displayName ?? embedded?.username,
    status: t.status ?? "",
    publishedUrl: t.platformPostUrl,
  };
}

function mapFeedPost(p: any): FeedPost {
  return {
    id: p._id,
    content: p.content ?? "",
    status: p.status ?? "",
    publishedAt: p.publishedAt ?? p.scheduledFor,
    scheduledFor: p.scheduledFor,
    createdAt: p.createdAt,
    media: (p.mediaItems ?? []).map((m: any) => ({
      type: m.type ?? "image",
      url: m.url,
      thumbnail: m.thumbnail,
    })),
    platforms: (p.platforms ?? []).map(mapPlatformTarget),
  };
}

async function fetchPosts(
  profileId: string,
  opts: { limit?: number; status?: string; sortBy?: string } = {}
): Promise<FeedPost[]> {
  const qs = new URLSearchParams({ profileId, limit: String(opts.limit ?? 20) });
  if (opts.status) qs.set("status", opts.status);
  if (opts.sortBy) qs.set("sortBy", opts.sortBy);
  const { posts } = await zernioFetch<{ posts: any[] }>(
    `/posts?${qs.toString()}`
  );
  return (posts ?? []).map(mapFeedPost);
}

/** GET /v1/posts?profileId=.. — this user's posts (sorted newest first). */
export async function listPosts(profileId: string, limit = 20): Promise<FeedPost[]> {
  const mapped = await fetchPosts(profileId, { limit });

  // Live feed = posts that actually went out (published or partially so).
  const live = mapped.filter((p) => p.status === "published" || p.status === "partial");
  return (live.length ? live : mapped).sort((a, b) =>
    (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
  );
}

/** GET /v1/posts — every post (published, partial, scheduled), newest first. */
export async function listAllPosts(
  profileId: string,
  limit = 100
): Promise<FeedPost[]> {
  const mapped = await fetchPosts(profileId, { limit });
  return mapped.sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
}

/** GET /v1/posts?status=scheduled — this user's upcoming scheduled posts. */
export async function listScheduledPosts(
  profileId: string,
  limit = 50
): Promise<FeedPost[]> {
  const posts = await fetchPosts(profileId, {
    limit,
    status: "scheduled",
    sortBy: "scheduled-desc",
  });
  return posts.sort((a, b) =>
    (a.scheduledFor ?? a.createdAt).localeCompare(b.scheduledFor ?? b.createdAt)
  );
}

/** DELETE /v1/posts/{postId} — cancel a scheduled (not yet published) post. */
export async function cancelPost(postId: string) {
  return zernioFetch<{ message?: string }>(`/posts/${postId}`, {
    method: "DELETE",
  });
}

/** GET /v1/accounts/{accountId}/instagram/stories — active 24h stories. */
export async function listInstagramStories(
  accountId: string
): Promise<Story[]> {
  const { data } = await zernioFetch<{ data: any[] }>(
    `/accounts/${accountId}/instagram/stories`
  );
  return (data ?? []).map((s) => ({
    id: s.id,
    mediaType: s.mediaType,
    mediaUrl: s.mediaUrl,
    permalink: s.permalink,
    thumbnailUrl: s.thumbnailUrl,
    timestamp: s.timestamp,
  }));
}

/* -------------------------------- Inbox --------------------------------- */
/*
 * Unified inbox (comments, DMs, mentions). Every endpoint requires the inbox
 * add-on; Zernio returns 403 "Inbox addon required" when it's not present.
 * Callers should surface a friendly empty/upsell state on 403.
 */

export interface InboxCommentSummary {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  content?: string;
  picture?: string | null;
  permalink?: string | null;
  createdTime?: string;
  commentCount: number;
  likeCount?: number;
  isAd?: boolean;
  adId?: string;
  placement?: string;
}

export interface InboxCommentAuthor {
  id: string;
  name: string;
  username?: string;
  picture?: string | null;
  isOwner?: boolean;
  verifiedType?: string | null;
}

export interface InboxComment {
  id: string;
  message: string;
  createdTime?: string;
  from?: InboxCommentAuthor;
  likeCount?: number;
  replyCount?: number;
  platform?: string;
  url?: string | null;
  canReply?: boolean;
  canDelete?: boolean;
  canHide?: boolean;
  canLike?: boolean;
  isHidden?: boolean;
  isLiked?: boolean;
  cid?: string | null;
  parentId?: string | null;
}

export interface InboxConversation {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  participantName?: string;
  lastMessage?: string;
  unreadCount?: number | null;
  url?: string | null;
}

export interface InboxMention {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  text?: string;
  url?: string | null;
  authorName?: string | null;
  authorUsername?: string | null;
  authorAvatar?: string | null;
}

interface Paginated<T> {
  data: T[];
  pagination?: { hasMore?: boolean; nextCursor?: string | null; cursor?: string | null };
  meta?: Record<string, unknown>;
}

function qs(params: Record<string, string | number | undefined>) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) out.set(k, String(v));
  }
  return out.toString();
}

/** GET /v1/inbox/comments — posts with comment counts across all accounts. */
export async function listInboxComments(
  profileId: string,
  limit = 25
): Promise<Paginated<InboxCommentSummary>> {
  return zernioFetch<Paginated<InboxCommentSummary>>(
    `/inbox/comments?${qs({ profileId, limit })}`
  );
}

/** GET /v1/inbox/comments/{postId} — the actual comments on one post. */
export async function getInboxPostComments(
  postId: string,
  accountId: string
): Promise<{ comments: InboxComment[]; post?: Record<string, unknown> | null; meta?: Record<string, unknown> }> {
  return zernioFetch<{
    comments: InboxComment[];
    post?: Record<string, unknown> | null;
    meta?: Record<string, unknown>;
  }>(`/inbox/comments/${encodeURIComponent(postId)}?${qs({ accountId })}`);
}

/** POST /v1/inbox/comments/{postId} — reply to a post or a specific comment. */
export async function replyToComment(
  postId: string,
  params: { accountId: string; message: string; commentId?: string }
) {
  return zernioFetch<{ success: boolean; data: { commentId: string; isReply: boolean } }>(
    `/inbox/comments/${encodeURIComponent(postId)}`,
    { method: "POST", body: JSON.stringify(params) }
  );
}

/** POST /v1/inbox/comments/{postId}/{commentId}/like */
export async function likeComment(postId: string, commentId: string, accountId: string) {
  return zernioFetch<{ status: string; commentId: string; liked: boolean; platform: string }>(
    `/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/like`,
    { method: "POST", body: JSON.stringify({ accountId }) }
  );
}

/** POST /v1/inbox/comments/{postId}/{commentId}/hide */
export async function hideComment(postId: string, commentId: string, accountId: string) {
  return zernioFetch<{ status: string; commentId: string; hidden: boolean }>(
    `/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/hide`,
    { method: "POST", body: JSON.stringify({ accountId }) }
  );
}

/** POST /v1/inbox/comments/{postId}/{commentId}/private-reply */
export async function privateReplyComment(
  postId: string,
  commentId: string,
  params: { accountId: string; message: string }
) {
  return zernioFetch<{ success?: boolean }>(
    `/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/private-reply`,
    { method: "POST", body: JSON.stringify(params) }
  );
}

/** GET /v1/inbox/conversations — DM threads across all connected accounts. */
export async function listInboxConversations(
  profileId: string,
  limit = 25
): Promise<Paginated<InboxConversation>> {
  return zernioFetch<Paginated<InboxConversation>>(
    `/inbox/conversations?${qs({ profileId, limit })}`
  );
}

/** POST /v1/inbox/conversations/{conversationId}/messages — send a DM. */
export async function sendDmMessage(
  conversationId: string,
  params: { accountId: string; message: string }
) {
  return zernioFetch<{ success?: boolean; data?: Record<string, unknown> }>(
    `/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: JSON.stringify(params) }
  );
}

/** GET /v1/inbox/mentions — mentions of the user's org accounts. */
export async function listInboxMentions(
  profileId: string,
  limit = 25
): Promise<Paginated<InboxMention>> {
  return zernioFetch<Paginated<InboxMention>>(
    `/inbox/mentions?${qs({ profileId, limit })}`
  );
}

/** POST /v1/inbox/mentions/reply — reply to a mention (Instagram). */
export async function replyToMention(
  params: { accountId: string; mediaId: string; message: string }
) {
  return zernioFetch<{ success?: boolean; data?: Record<string, unknown> }>(
    `/inbox/mentions/reply`,
    { method: "POST", body: JSON.stringify(params) }
  );
}

/* -------------------------------- Calendar ------------------------------ */
/* Visual content calendar: queue slots + rescheduling scheduled posts. */

export interface QueueSlot {
  dayOfWeek: number; // 0=Monday .. 6=Sunday
  time: string; // "HH:mm"
}

export interface QueueSchedule {
  id?: string;
  name?: string;
  slots?: QueueSlot[];
  timezone?: string;
}

/** GET /v1/queue/slots — the profile's posting-queue schedules. */
export async function getQueueSlots(profileId: string): Promise<QueueSchedule[]> {
  const res = await zernioFetch<{
    slots?: QueueSlot[];
    queues?: QueueSchedule[];
  }>(`/queue/slots?${qs({ profileId })}`);
  if (Array.isArray(res.queues)) return res.queues;
  if (Array.isArray(res.slots)) return [{ id: undefined, name: "Default", slots: res.slots }];
  return [];
}

/** GET /v1/queue/next-slot — next available queue slot (preview). */
export async function getNextQueueSlot(profileId: string): Promise<{
  scheduledFor?: string;
  timezone?: string;
}> {
  return zernioFetch<{ scheduledFor?: string; timezone?: string }>(
    `/queue/next-slot?${qs({ profileId })}`
  );
}

/** PUT /v1/posts/{postId} — update a scheduled post (reschedule). */
export async function updatePost(
  postId: string,
  patch: { scheduledFor?: string; timezone?: string }
) {
  return zernioFetch<{ post?: Record<string, unknown>; message?: string }>(
    `/posts/${postId}`,
    { method: "PUT", body: JSON.stringify(patch) }
  );
}
