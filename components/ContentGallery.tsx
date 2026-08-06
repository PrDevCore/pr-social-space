"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedPost, SocialAccount, SocialPlatform } from "@/lib/zernio";
import { PlatformBadge, PLATFORMS } from "./PlatformIcon";

interface ContentItem {
  key: string;
  type: string; // image | video | gif
  url: string;
  thumbnail?: string;
  post: FeedPost;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isVideoType(type: string) {
  return type === "video";
}

function MediaTile({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
  const isVideo = isVideoType(item.type);
  const isGif = item.type === "gif";
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-black/5 text-left transition hover:border-black/25 hover:shadow-md"
      title="Open full media"
    >
      {item.thumbnail ?? item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail ?? item.url}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs text-black/40">
          No preview
        </span>
      )}

      {isVideo && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      )}
      {isGif && (
        <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
          GIF
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-6 text-xs text-white transition duration-200 group-hover:translate-y-0">
        <p className="line-clamp-2">{item.post.content || "No caption"}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {item.post.platforms.map((p, i) => (
              <PlatformBadge key={`${item.key}-${i}`} platform={p.platform} />
            ))}
          </div>
          <span className="shrink-0 text-[10px] text-white/70">
            {formatDate(item.post.publishedAt ?? item.post.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function ContentGallery({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | "all">("all");
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/content", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load content.");
      }
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Close the lightbox with Escape.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const items = useMemo<ContentItem[]>(
    () =>
      posts.flatMap((post) =>
        (post.media ?? []).map((m, i) => ({
          key: `${post.id}-${i}`,
          type: m.type ?? "image",
          url: m.url,
          thumbnail: m.thumbnail,
          post,
        }))
      ),
    [posts]
  );

  const connectedPlatforms = accounts
    .map((a) => a.platform)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const filtered = items.filter((item) => {
    if (typeFilter === "video" && !isVideoType(item.type)) return false;
    if (typeFilter === "image" && isVideoType(item.type)) return false;
    if (platformFilter !== "all" && !item.post.platforms.some((p) => p.platform === platformFilter))
      return false;
    return true;
  });

  const imageCount = items.filter((i) => !isVideoType(i.type)).length;
  const videoCount = items.length - imageCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-black/50">Media library</p>
          <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
          <p className="mt-1 text-sm text-black/60">
            {items.length} media file{items.length !== 1 ? "s" : ""} across{" "}
            {posts.length} post{posts.length !== 1 ? "s" : ""} · {imageCount}{" "}
            image{imageCount !== 1 ? "s" : ""} · {videoCount} video
            {videoCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex gap-1 rounded-xl border border-black/10 bg-white p-1">
          {(
            [
              { id: "all", label: `All (${items.length})` },
              { id: "image", label: `Images (${imageCount})` },
              { id: "video", label: `Videos (${videoCount})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              role="tab"
              onClick={() => setTypeFilter(f.id)}
              aria-selected={typeFilter === f.id}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                typeFilter === f.id
                  ? "bg-ink text-white"
                  : "text-black/60 hover:bg-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {connectedPlatforms.length > 0 && (
          <select
            value={platformFilter}
            onChange={(e) =>
              setPlatformFilter(e.target.value as SocialPlatform | "all")
            }
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black/70 outline-none focus:border-accent"
          >
            <option value="all">All platforms</option>
            {connectedPlatforms.map((p) => {
              const meta = PLATFORMS.find((x) => x.id === p);
              return (
                <option key={p} value={p}>
                  {meta?.label ?? p}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Grid */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <p className="text-sm font-medium text-black/70">
            {items.length === 0 ? "No content yet." : "Nothing matches those filters."}
          </p>
          <p className="text-sm text-black/50">
            {items.length === 0
              ? "Publish a post with media and it will appear here at full size."
              : "Try clearing a filter."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <MediaTile key={item.key} item={item} onOpen={() => setSelected(item)} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="flex max-h-full w-full max-w-4xl flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-xl bg-black/40">
              {isVideoType(selected.type) ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={selected.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-auto max-w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.url}
                  alt=""
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              )}
            </div>

            <div className="w-full space-y-2 rounded-xl bg-white/5 p-4 text-white backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {selected.post.platforms.map((p, i) => (
                    <PlatformBadge key={i} platform={p.platform} />
                  ))}
                </div>
                <span className="text-xs text-white/60">
                  {formatDate(selected.post.publishedAt ?? selected.post.createdAt)}
                  {selected.post.status ? ` · ${selected.post.status}` : ""}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                {selected.post.content || "No caption"}
              </p>
              {selected.post.platforms.some((p) => p.publishedUrl) && (
                <a
                  href={selected.post.platforms.find((p) => p.publishedUrl)?.publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Open original post
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
