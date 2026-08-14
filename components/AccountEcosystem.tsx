"use client";

import { useEffect, useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import AccountCard from "./AccountCard";
import ConnectAccountButton from "./ConnectAccountButton";
import StatusBadge, { type StatusTone } from "./StatusBadge";

interface ScheduledPost {
  id: string;
  scheduledFor?: string;
  content?: string;
}

function formatNext(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function NextUpCard() {
  const [next, setNext] = useState<ScheduledPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/schedules", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const posts: ScheduledPost[] = data?.posts ?? [];
        const upcoming = posts
          .filter((p) => p.scheduledFor && new Date(p.scheduledFor) > new Date())
          .sort(
            (a, b) =>
              Date.parse(a.scheduledFor ?? "") - Date.parse(b.scheduledFor ?? "")
          )[0];
        setNext(upcoming ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
        Next up
      </h2>
      {loading ? (
        <div className="h-14 animate-pulse rounded-xl bg-black/5" />
      ) : next ? (
        <div className="rounded-xl border border-black/10 bg-white p-3">
          <p className="text-xs font-semibold text-accent">
            {formatNext(next.scheduledFor)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-black/80">
            {next.content || "(no caption)"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-black/50">
          Nothing scheduled. Pick a date in the composer to queue a post.
        </p>
      )}
    </div>
  );
}

/**
 * "Account Ecosystem": connected accounts with per-account follower counts and
 * manage (disconnect) controls, an aggregate reach figure, a backend/API status
 * line, and quick "connect a platform" actions.
 */
export default function AccountEcosystem({
  accounts,
  onDisconnected,
  unconnected,
  apiError = false,
  showNextUp = true,
}: {
  accounts: SocialAccount[];
  onDisconnected: (id: string) => void;
  unconnected: SocialPlatform[];
  apiError?: boolean;
  showNextUp?: boolean;
}) {
  const totalReach = accounts.reduce(
    (sum, a) => sum + (a.followers_count ?? 0),
    0
  );
  const apiStatus: StatusTone = apiError ? "error" : "optimal";
  const apiLabel = apiError ? "API unreachable" : "API connected";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
            Account Ecosystem
          </h2>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
            {accounts.length}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-black/50">
              Total reach
            </p>
            <p className="text-lg font-semibold leading-tight">
              {totalReach.toLocaleString()}
            </p>
          </div>
          <StatusBadge tone={apiStatus} label={apiLabel} />
        </div>

        {accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onDisconnected={onDisconnected}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-4 text-center text-sm text-black/50">
            No accounts connected yet.
          </div>
        )}
      </div>

      {unconnected.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
            Connect a platform
          </h2>
          <div className="flex flex-col gap-2">
            {unconnected.map((p) => (
              <ConnectAccountButton key={p} platform={p} />
            ))}
          </div>
        </div>
      )}

      {showNextUp && <NextUpCard />}
    </div>
  );
}