"use client";

import { useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import ActivityPanel from "./ActivityPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import CalendarPanel from "./CalendarPanel";
import CompetitorsPanel from "./CompetitorsPanel";
import ComposePost from "./ComposePost";
import DashboardStats from "./DashboardStats";
import FeedSection from "./FeedSection";
import InboxPanel from "./InboxPanel";
import SchedulerPanel from "./SchedulerPanel";
import SideTray, { TrayPanel } from "./SideTray";
import { PLATFORMS } from "./PlatformIcon";

type Tab =
  | "compose"
  | "feeds"
  | "activity"
  | "scheduler"
  | "inbox"
  | "calendar"
  | "analytics"
  | "competitors";

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
    id: "inbox",
    label: "Inbox",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4l-2 2h-4l-2-2H4" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
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
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m16 14v-5m-8 5v-8m4 8V9M4 5a2 2 0 00-2 2m18-2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "competitors",
    label: "Competitors",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5 3-1-1 4 5-5-3-1 2-5-4 3zm-9-2l-2 5 3-1-1 4 5-5-3-1 2-5-4 3zM9 5a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const [trayOpen, setTrayOpen] = useState(false);
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const unconnected: SocialPlatform[] = PLATFORMS.filter(
    (p) => !connectedPlatforms.has(p.id)
  ).map((p) => p.id);

  const onDisconnected = (id: string) =>
    setAccounts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-6">
      <DashboardStats accounts={accounts} />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Vertical navigation */}
        <nav
          role="tablist"
          className="hidden self-start rounded-2xl border border-black/10 bg-white p-2 lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
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

        {/* Main workspace */}
        <main className="min-w-0">
          <nav
            role="tablist"
            className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-black/10 bg-white p-1 lg:hidden"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                onClick={() => setTab(t.id)}
                aria-selected={tab === t.id}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
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
          {tab === "inbox" && <InboxPanel />}
          {tab === "calendar" && <CalendarPanel />}
          {tab === "feeds" && <FeedSection accounts={accounts} />}
          {tab === "activity" && <ActivityPanel accounts={accounts} />}
          {tab === "scheduler" && <SchedulerPanel accounts={accounts} />}
          {tab === "analytics" && <AnalyticsPanel />}
          {tab === "competitors" && <CompetitorsPanel />}
        </main>

        {/* Persistent tray column (xl+) */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <TrayPanel
              accounts={accounts}
              onDisconnected={onDisconnected}
              unconnected={unconnected}
            />
          </div>
        </div>
      </div>

      {/* Slide-over tray toggle (below xl) */}
      <button
        onClick={() => setTrayOpen(true)}
        aria-label="Open side tray"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:bg-black xl:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
        </svg>
      </button>

      <SideTray
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        accounts={accounts}
        onDisconnected={onDisconnected}
        unconnected={unconnected}
      />
    </div>
  );
}
