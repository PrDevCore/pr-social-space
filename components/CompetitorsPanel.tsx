"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SocialPlatform } from "@/lib/zernio";
import { PLATFORMS, PlatformBadge } from "./PlatformIcon";

interface Snapshot {
  date: string;
  followers: number;
}

interface Competitor {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  followerSnapshots: Snapshot[];
  createdAt: string;
}

interface FollowerPoint {
  date: string;
  followers: number;
}

const fmt = new Intl.NumberFormat("en");

function MultiLineChart({ series }: { series: { label: string; color: string; points: FollowerPoint[] }[] }) {
  const W = 600;
  const H = 180;
  const PAD = 10;
  const flat = series.flatMap((s) => s.points);
  if (flat.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Add follower snapshots to see the comparison.
      </div>
    );
  }
  const values = flat.map((p) => p.followers);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const stepX = (W - PAD * 2) / (flat.length - 1);

  const seriesPaths = series.map((s) => {
    const ordered = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
    const path = ordered
      .map((p, i) => {
        const x = PAD + stepX * i;
        const y = PAD + (H - PAD * 2) * (1 - (p.followers - min) / range);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return { s, path };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Follower comparison">
      {seriesPaths.map(({ s, path }) => (
        <polyline key={s.label} points={path.replace(/[ML]/g, "")} fill="none" strokeWidth={2} className={s.color} />
      ))}
    </svg>
  );
}

export default function CompetitorsPanel() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ platform: "instagram", username: "", displayName: "" });
  const [saving, setSaving] = useState(false);

  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [compareId, setCompareId] = useState<string>("");
  const [ownFollowers, setOwnFollowers] = useState<FollowerPoint[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/social/competitors", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load competitors");
      const data = await res.json();
      setCompetitors(Array.isArray(data.competitors) ? data.competitors : []);
    } catch {
      setError("Couldn't load competitors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      try {
        const res = await fetch("/api/social/analytics?tab=followers", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const stats: Record<string, FollowerPoint[]> | FollowerPoint[] | undefined = data.stats;
        const first = Array.isArray(stats)
          ? stats
          : stats && typeof stats === "object"
            ? Object.entries(stats)[0]?.[1] ?? []
            : [];
        setOwnFollowers(first.filter((p) => typeof p.followers === "number"));
      } catch {
        // follower history is optional for the compare view
      }
    })();
  }, [load]);

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/social/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          username: form.username,
          displayName: form.displayName || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add competitor");
      }
      setForm({ platform: "instagram", username: "", displayName: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add competitor");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/social/competitors?competitorId=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  const recordSnapshot = async (id: string) => {
    const raw = snapshots[id];
    const n = Number(raw);
    if (!raw || Number.isNaN(n) || n < 0) return;
    const res = await fetch(`/api/social/competitors?competitorId=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followers: Math.round(n) }),
    });
    if (res.ok) {
      setSnapshots((s) => ({ ...s, [id]: "" }));
      await load();
    }
  };

  const ownSeries = useMemo<FollowerPoint[]>(() => ownFollowers, [ownFollowers]);

  const chartSeries = useMemo(() => {
    const own = ownSeries;
    const series: { label: string; color: string; points: FollowerPoint[] }[] = [];
    if (own.length) series.push({ label: "You", color: "stroke-emerald-500", points: own });
    if (compareId) {
      const c = competitors.find((x) => x.id === compareId);
      if (c && c.followerSnapshots.length) {
        series.push({ label: c.username, color: "stroke-blue-500", points: c.followerSnapshots });
      }
    }
    return series;
  }, [ownSeries, compareId, competitors]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Competitors</h3>
      </div>

      <form onSubmit={addCompetitor} className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Platform
          <select
            value={form.platform}
            onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Username
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="@brand"
            required
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Display name (optional)
          <input
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Brand Name"
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !form.username.trim()}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add competitor"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
          Track your competitors&apos; follower growth alongside your own.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
            {competitors.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <PlatformBadge platform={c.platform as SocialPlatform} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {c.displayName || c.username}
                    {c.displayName && <span className="font-normal text-gray-400"> · @{c.username}</span>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {fmt.format(c.followerSnapshots.at(-1)?.followers ?? 0)} followers ·{" "}
                    {c.followerSnapshots.length} snapshot{c.followerSnapshots.length === 1 ? "" : "s"}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Today's followers"
                  value={snapshots[c.id] ?? ""}
                  onChange={(e) => setSnapshots((s) => ({ ...s, [c.id]: e.target.value }))}
                  className="w-32 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => recordSnapshot(c.id)}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700"
                >
                  Log
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {competitors.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Follower comparison</h3>
                <select
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="">Select a competitor…</option>
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName || c.username}
                    </option>
                  ))}
                </select>
              </div>
              <MultiLineChart series={chartSeries} />
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Your follower history comes from Zernio Analytics; competitor lines come from your manual snapshots.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
