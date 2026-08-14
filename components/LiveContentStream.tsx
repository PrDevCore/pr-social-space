"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedPost, SocialAccount, Story } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";

interface StoryGroup {
  accountId: string;
  accountName?: string;
  stories: Story[];
}

interface FeedData {
  posts: FeedPost[];
  stories: StoryGroup[];
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LiveBadge({ subtle = false }: { subtle?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
        subtle ? "" : "absolute left-1.5 top-1.5"
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      Live
    </span>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const image = post.media.find((m) => m.type === "image");
  const isVideo = post.media.some((m) => m.type === "video" || m.type === "gif");
  return (
    <article className="overflow-hidden rounded-xl border border-black/10 bg-white">
      {image ? (
        <div className="relative aspect-video w-full overflow-hidden bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          {isVideo && <LiveBadge />}
        </div>
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center bg-black/5 text-xs text-black/50">
          Video post
          {isVideo && <LiveBadge />}
        </div>
      )}
      <div className="space-y-2 p-3">
        <p className="line-clamp-3 text-sm text-black/80">
          {post.content || "(no caption)"}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {post.platforms.map((p, i) =>
              p.publishedUrl ? (
                <a
                  key={`${post.id}-${i}`}
                  href={p.publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open original post"
                >
                  <PlatformBadge platform={p.platform} />
                </a>
              ) : (
                <PlatformBadge key={`${post.id}-${i}`} platform={p.platform} />
              )
            )}
          </div>
          <span className="shrink-0 text-[11px] text-black/40">
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * "Live Content Stream": a full-width band of active Instagram stories and
 * recent published posts. Video/story thumbnails are flagged with a LIVE badge.
 */
export default function LiveContentStream({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/feed", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load feed.");
      }
      setData(await res.json());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasStories = (data?.stories ?? []).some((g) => g.stories.length > 0);
  const postsByAccount = accounts
    .map((account) => ({
      account,
      posts: (data?.posts ?? []).filter((p) =>
        p.platforms.some((pl) => pl.accountId === account.id)
      ),
    }))
    .filter((g) => g.posts.length > 0);
  const hasPosts = postsByAccount.length > 0;

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            Live Content Stream
          </h2>
          <LiveBadge subtle />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
            aria-expanded={open}
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-16 animate-pulse rounded-lg bg-black/5" />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-black/5" />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !hasStories && !hasPosts && (
            <p className="text-sm text-black/50">
              No activity yet. Publish a post and it will show up here.
            </p>
          )}

          {hasStories && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">
                Active Instagram stories
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(data?.stories ?? []).map(
                  (g) =>
                    g.stories.length > 0 && (
                      <div key={g.accountId} className="shrink-0">
                        <p className="mb-1.5 text-xs font-medium text-black/60">
                          {g.accountName ?? "Instagram"}
                        </p>
                        <div className="flex gap-2">
                          {g.stories.map((s) => (
                            <a
                              key={s.id}
                              href={s.permalink ?? s.mediaUrl ?? "#"}
                              target={s.permalink ? "_blank" : undefined}
                              rel="noreferrer"
                              className="relative block h-20 w-16 overflow-hidden rounded-lg border border-black/10 bg-black/5"
                              title="Open story"
                            >
                              {s.thumbnailUrl ?? s.mediaUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.thumbnailUrl ?? s.mediaUrl}
                                  alt="Story"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] text-black/50">
                                  Story
                                </span>
                              )}
                              <LiveBadge />
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {hasPosts && (
            <div className="space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50">
                Previous posts by account
              </h3>
              {postsByAccount.map(({ account, posts }) => (
                <div key={account.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                      {(account.display_name ?? account.username ?? account.id)
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.display_name ?? account.username ?? account.id}
                      </p>
                      <p className="text-[11px] text-black/40">
                        {posts.length} post{posts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}