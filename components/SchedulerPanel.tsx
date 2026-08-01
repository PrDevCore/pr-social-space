"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedPost, SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";

function formatSchedule(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SchedulerPanel({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const platformByAccountId = new Map(
    accounts.map((a) => [a.id, a.platform])
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/schedules", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load scheduled posts.");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled post?")) return;
    setCancelling(id);
    try {
      const res = await fetch("/api/social/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Couldn't cancel that post.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Scheduler</h2>
          <p className="text-xs text-black/50">
            Posts queued to publish automatically.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-black/50">
          Nothing scheduled. Pick a date in the composer to queue a post.
        </p>
      ) : (
        <ol className="space-y-3">
          {posts.map((p) => {
            const past = p.scheduledFor && new Date(p.scheduledFor) < new Date();
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-accent">
                      {formatSchedule(p.scheduledFor)}
                    </span>
                    {past && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                        due
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-black/80">
                    {p.content || "(no caption)"}
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    {p.platforms.map((pl, i) => {
                      const platform =
                        pl.platform ??
                        (pl.accountId
                          ? platformByAccountId.get(pl.accountId)
                          : undefined);
                      return platform ? (
                        <PlatformBadge key={`${p.id}-${i}`} platform={platform} />
                      ) : null;
                    })}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(p.id)}
                  disabled={cancelling === p.id}
                  className="shrink-0 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling === p.id ? "Cancelling…" : "Cancel"}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
