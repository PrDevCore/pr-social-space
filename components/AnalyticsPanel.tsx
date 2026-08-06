"use client";

import { useEffect, useMemo, useState } from "react";
import type { SocialPlatform } from "@/lib/zernio";
import BestTimeCard from "./BestTimeCard";
import { PlatformBadge } from "./PlatformIcon";

interface PostAnalytics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  engagementRate?: number;
}

interface AnalyticsPost {
  id: string;
  content?: string;
  status?: string;
  publishedAt?: string;
  scheduledFor?: string;
  analytics?: PostAnalytics;
  platform?: string;
  platformPostUrl?: string;
  isExternal?: boolean;
  thumbnailUrl?: string;
  profileId?: string;
  platforms?: Array<{
    platform: string;
    accountId: string;
    accountUsername?: string;
    analytics?: PostAnalytics;
    platformPostUrl?: string;
  }>;
}

interface DailyPoint {
  date: string;
  metrics?: PostAnalytics;
}

interface PlatformBreakdown {
  platform: string;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
}

interface FollowerPoint {
  date: string;
  followers: number;
}

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

const fmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function fmtNum(n: number | undefined): string {
  return n == null ? "—" : fmt.format(n);
}

function pct(n: number | undefined): string {
  return n == null ? "—" : `${Math.round(n * 1000) / 10}%`;
}

function metricSum(posts: AnalyticsPost[], key: keyof PostAnalytics): number {
  let total = 0;
  for (const p of posts) {
    if (p.analytics && typeof p.analytics[key] === "number") {
      total += (p.analytics[key] as number) ?? 0;
    }
    for (const pl of p.platforms ?? []) {
      if (pl.analytics && typeof pl.analytics[key] === "number") {
        total += (pl.analytics[key] as number) ?? 0;
      }
    }
  }
  return total;
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function LineChart({
  points,
  height = 160,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const W = 600;
  const PAD = 8;
  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Not enough data yet.
      </div>
    );
  }
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = Math.max(max - min, 1);
  const stepX = (W - PAD * 2) / (points.length - 1);
  const xy = (i: number) => {
    const x = PAD + stepX * i;
    const y = PAD + (height - PAD * 2) * (1 - (points[i].value - min) / range);
    return [x, y] as const;
  };
  const path = points.map((_, i) => xy(i).join(",")).join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="h-40 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Engagement over time"
    >
      <polygon points={`${PAD},${height - PAD} ${path} ${W - PAD},${height - PAD}`} className="fill-emerald-500/10" />
      <polyline points={path} fill="none" strokeWidth={2} className="stroke-emerald-500" />
      {points.map((p, i) => {
        const [x, y] = xy(i);
        return <circle key={p.label + i} cx={x} cy={y} r={3} className="fill-emerald-500" />;
      })}
    </svg>
  );
}

type Tab = "posts" | "daily" | "followers";

export default function AnalyticsPanel() {
  const [tab, setTab] = useState<Tab>("posts");
  const [preset, setPreset] = useState(30);
  const [from, setFrom] = useState(() => isoDaysAgo(30));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addonMissing, setAddonMissing] = useState(false);
  const [posts, setPosts] = useState<AnalyticsPost[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [breakdown, setBreakdown] = useState<PlatformBreakdown[]>([]);
  const [followers, setFollowers] = useState<FollowerPoint[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setAddonMissing(false);
    const q = `?from=${from}&to=${to}`;
    (async () => {
      try {
        const [postsRes, dailyRes, folRes] = await Promise.all([
          fetch(`/api/social/analytics?tab=posts${q}`, { cache: "no-store" }),
          fetch(`/api/social/analytics?tab=daily${q}`, { cache: "no-store" }),
          fetch(`/api/social/analytics?tab=followers${q}`, { cache: "no-store" }),
        ]);
        if ([postsRes, dailyRes, folRes].some((r) => r.status === 403)) {
          if (active) setAddonMissing(true);
          return;
        }
        if (!postsRes.ok || !dailyRes.ok || !folRes.ok) {
          throw new Error("Request failed");
        }
        const [p, d, f] = await Promise.all([
          postsRes.json(),
          dailyRes.json(),
          folRes.json(),
        ]);
        if (!active) return;
        setPosts(Array.isArray(p.posts) ? p.posts : []);
        setDaily(Array.isArray(d.dailyData) ? d.dailyData : []);
        setBreakdown(Array.isArray(d.platformBreakdown) ? d.platformBreakdown : []);
        setFollowers(
          Array.isArray(f.stats)
            ? (f.stats as FollowerPoint[])
            : f.stats && typeof f.stats === "object"
              ? Object.entries(f.stats as Record<string, FollowerPoint[]>)[0]?.[1] ?? []
              : []
        );
      } catch {
        if (active) setError("Couldn't load analytics. Try again later.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [from, to]);

  const applyPreset = (days: number) => {
    setPreset(days);
    setFrom(isoDaysAgo(days));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const kpis = useMemo(() => {
    const likes = metricSum(posts, "likes");
    const comments = metricSum(posts, "comments");
    const shares = metricSum(posts, "shares");
    const saves = metricSum(posts, "saves");
    const views = metricSum(posts, "views");
    const impressions = metricSum(posts, "impressions");
    const reach = metricSum(posts, "reach");
    const er =
      impressions > 0 ? (((likes + comments + shares) / impressions) * 100) : undefined;
    return { likes, comments, shares, saves, views, impressions, reach, er };
  }, [posts]);

  const chartPoints = useMemo(
    () =>
      daily.map((d) => {
        const likes = d.metrics?.likes ?? 0;
        const comments = d.metrics?.comments ?? 0;
        const impressions = d.metrics?.impressions ?? 0;
        return {
          label: d.date,
          value: impressions > 0 ? likes + comments + sharesOf(d.metrics) : 0,
          impressions,
        };
      }),
    [daily]
  );

  const folChart = useMemo(
    () =>
      followers
        .filter((p) => typeof p.followers === "number")
        .map((p) => ({ label: p.date, value: p.followers })),
    [followers]
  );

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? "")),
    [posts]
  );

  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const res = await fetch(`/api/reports/pdf?from=${from}&to=${to}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "PDF export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `social-hub-report-${from}-${to}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  };

  if (addonMissing) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics aren&apos;t enabled</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
          Connect the Analytics add-on in Zernio to unlock post insights, follower growth, and
          best-time recommendations.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-red-500/40 p-8 text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["posts", "daily", "followers"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
                tab === t
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => applyPreset(p.days)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                preset === p.days
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setPreset(0);
              setFrom(e.target.value);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setPreset(0);
              setTo(e.target.value);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 transition hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 18v2a1 1 0 001 1h14a1 1 0 001-1v-2M4 6V4a1 1 0 011-1h10l4 4v2" />
            </svg>
            {pdfBusy ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {pdfError && (
        <p className="text-xs text-red-600 dark:text-red-400">{pdfError}</p>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Impressions" value={fmtNum(kpis.impressions)} sub={breakdown.length ? `${breakdown.length} platform${breakdown.length > 1 ? "s" : ""}` : undefined} />
            <MetricCard label="Reach" value={fmtNum(kpis.reach)} />
            <MetricCard label="Engagement rate" value={pct(kpis.er)} sub={`${fmtNum(kpis.likes)} likes · ${fmtNum(kpis.comments)} comments`} />
            <MetricCard label="Saves & shares" value={fmtNum(kpis.saves + kpis.shares)} />
          </div>

          {tab === "posts" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                Post performance ({sortedPosts.length})
              </div>
              {sortedPosts.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 dark:text-gray-500">
                  No published posts in this range yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedPosts.map((p) => {
                    const platform = (p.platform ?? p.platforms?.[0]?.platform) as
                      | SocialPlatform
                      | undefined;
                    const a = p.analytics ?? p.platforms?.[0]?.analytics;
                    return (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        {p.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnailUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-gray-800">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                            {p.content || "(no text)"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            {platform && <PlatformBadge platform={platform} />}
                            <span>
                              {p.publishedAt
                                ? new Date(p.publishedAt).toLocaleDateString()
                                : p.status ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span title="Likes">{fmtNum(a?.likes)} ♥</span>
                          <span title="Comments">{fmtNum(a?.comments)} 💬</span>
                          <span title="Engagement rate">
                            {a?.engagementRate != null
                              ? pct(a.engagementRate)
                              : pct(
                                  a?.likes != null && a?.impressions
                                    ? ((a.likes ?? 0) / (a.impressions || 1)) * 100
                                    : undefined
                                )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {tab === "daily" && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Likes + comments over time
              </div>
              <LineChart points={chartPoints} />
            </div>
          )}

          {tab === "followers" && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Follower growth
              </div>
              <LineChart points={folChart} />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <BestTimeCard compact />
          </div>
        </>
      )}
    </div>
  );
}

function sharesOf(m: PostAnalytics | undefined): number {
  return m?.shares ?? 0;
}
