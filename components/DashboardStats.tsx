"use client";

import { useEffect, useState } from "react";
import type { SocialAccount } from "@/lib/zernio";
import StatusBadge, { type StatusTone } from "./StatusBadge";

interface FeedSummary {
  posts: number;
  stories: number;
}

function StatCard({
  label,
  value,
  hint,
  icon,
  gradient,
  status,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  gradient: string;
  status: StatusTone;
}) {
  return (
    <div className="card relative flex items-center gap-4 overflow-hidden !p-4" aria-label={`${label}: ${value}`}>
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-black/50">
          {label}
        </p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="truncate text-[11px] text-black/40">{hint}</p>}
      </div>
      <StatusBadge tone={status} />
    </div>
  );
}

export default function DashboardStats({
  accounts,
  apiError = false,
}: {
  accounts: SocialAccount[];
  apiError?: boolean;
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
  const has = accounts.length > 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Accounts"
        value={accounts.length}
        hint={has ? "connected" : "none yet"}
        gradient="linear-gradient(135deg,#4F46E5,#8B5CF6)"
        status={apiError ? "error" : has ? "optimal" : "attention"}
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
        gradient="linear-gradient(135deg,#0EA5E9,#8B5CF6)"
        status={apiError ? "error" : has ? "optimal" : "attention"}
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
        gradient="linear-gradient(135deg,#E1306C,#9D4EDD)"
        status={apiError ? "error" : "optimal"}
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
        gradient="linear-gradient(135deg,#10B981,#14B8A6)"
        status={apiError ? "error" : "optimal"}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        }
      />
    </div>
  );
}