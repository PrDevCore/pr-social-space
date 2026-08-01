"use client";

import { useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import AccountCard from "./AccountCard";
import ActivityPanel from "./ActivityPanel";
import ComposePost from "./ComposePost";
import ConnectAccountButton from "./ConnectAccountButton";
import DashboardStats from "./DashboardStats";
import FeedSection from "./FeedSection";
import SchedulerPanel from "./SchedulerPanel";
import { PLATFORMS } from "./PlatformIcon";

type Tab = "compose" | "feeds" | "activity" | "scheduler";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "compose",
    label: "Compose",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: "feeds",
    label: "Live feeds",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a4 4 0 01-4 4H9a2 2 0 01-2-2v-2m0-10h10a2 2 0 012 2v6a2 2 0 01-2 2H7m0 4H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v3" />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "scheduler",
    label: "Scheduler",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
      </svg>
    ),
  },
];

export default function SocialDashboard({
  initialAccounts,
}: {
  initialAccounts: SocialAccount[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [tab, setTab] = useState<Tab>("compose");
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const unconnected = PLATFORMS.filter((p) => !connectedPlatforms.has(p.id));

  return (
    <div className="space-y-6">
      <DashboardStats accounts={accounts} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar: connected accounts + connect */}
        <aside className="space-y-6">
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
                    onDisconnected={(id) =>
                      setAccounts((prev) => prev.filter((x) => x.id !== id))
                    }
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
                  <ConnectAccountButton
                    key={p.id}
                    platform={p.id as SocialPlatform}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main workspace */}
        <main className="min-w-0">
          <nav className="mb-4 flex gap-1 rounded-xl border border-black/10 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-selected={tab === t.id}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-ink text-white shadow-sm"
                    : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "compose" && <ComposePost accounts={accounts} />}
          {tab === "feeds" && <FeedSection />}
          {tab === "activity" && <ActivityPanel accounts={accounts} />}
          {tab === "scheduler" && <SchedulerPanel accounts={accounts} />}
        </main>
      </div>
    </div>
  );
}
