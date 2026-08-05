"use client";

import { useEffect, useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import AccountCard from "./AccountCard";
import ConnectAccountButton from "./ConnectAccountButton";

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

export function TrayPanel({
  accounts,
  onDisconnected,
  unconnected,
}: {
  accounts: SocialAccount[];
  onDisconnected: (id: string) => void;
  unconnected: SocialPlatform[];
}) {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
            Connected
          </h2>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
            {accounts.length}
          </span>
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

      <NextUpCard />
    </div>
  );
}

export default function SideTray({
  open,
  onClose,
  accounts,
  onDisconnected,
  unconnected,
}: {
  open: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
  onDisconnected: (id: string) => void;
  unconnected: SocialPlatform[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 xl:hidden ${
        open ? "" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[min(20rem,85vw)] overflow-y-auto bg-paper p-4 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
            Side tray
          </h2>
          <button
            onClick={onClose}
            aria-label="Close side tray"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition hover:bg-black/5 hover:text-black"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <TrayPanel
          accounts={accounts}
          onDisconnected={onDisconnected}
          unconnected={unconnected}
        />
      </aside>
    </div>
  );
}
