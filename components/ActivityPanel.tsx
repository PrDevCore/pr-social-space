"use client";

import { useCallback, useEffect, useState } from "react";
import type { SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";

interface ActivityRecord {
  id: string;
  caption: string;
  socialAccountIds: string[];
  status: string;
  createdAt: string;
}

function statusColor(status: string) {
  if (status === "published") return "bg-green-100 text-green-700";
  if (status === "scheduled") return "bg-amber-100 text-amber-700";
  if (status === "failed" || status === "partial") return "bg-red-100 text-red-700";
  return "bg-black/5 text-black/60";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityPanel({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/posts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load activity.");
      const data = await res.json();
      setRecords(data.posts ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const platformByAccountId = new Map(
    accounts.map((a) => [a.id, a.platform])
  );

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Activity</h2>
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
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-black/5"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-black/50">
          Nothing yet. Your published and scheduled posts will appear here.
        </p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-black/10">
          {records.map((r) => (
            <li key={r.id} className="relative pl-8">
              <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent shadow" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[11px] font-medium text-black/40">
                  {timeAgo(r.createdAt)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
                <div className="flex gap-1">
                  {r.socialAccountIds.map((id) => {
                    const platform = platformByAccountId.get(id);
                    return platform ? (
                      <PlatformBadge key={id} platform={platform} />
                    ) : null;
                  })}
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-black/80">
                {r.caption}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
