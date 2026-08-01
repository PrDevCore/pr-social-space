"use client";

import { useEffect, useState } from "react";
import type { SocialAccount } from "@/lib/zernio";

interface FeedSummary {
  posts: number;
  stories: number;
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="card flex items-center gap-4 !p-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-black/50">
          {label}
        </p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="truncate text-[11px] text-black/40">{hint}</p>}
      </div>
    </div>
  );
}

export default function DashboardStats({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [summary, setSummary] = useState<FeedSummary>({ posts: 0, stories: 0 });

  useEffect(() => {
    let active = true;
    fetch("/api/social/feed", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setSummary({
          posts: data.posts?.length ?? 0,
          stories: (data.stories ?? []).reduce(
            (n: number, g: { stories: unknown[] }) => n + g.stories.length,
            0
          ),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const platforms = new Set(accounts.map((a) => a.platform)).size;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Accounts"
        value={accounts.length}
        hint={accounts.length ? "connected" : "none yet"}
        accent="#3F5BFF"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
      <StatCard
        label="Platforms"
        value={platforms}
        hint="in use"
        accent="#0EA5E9"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        }
      />
      <StatCard
        label="Live stories"
        value={summary.stories}
        hint="active 24h"
        accent="#E1306C"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
          </svg>
        }
      />
      <StatCard
        label="Published"
        value={summary.posts}
        hint="recent posts"
        accent="#10B981"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        }
      />
    </div>
  );
}
