"use client";

import { useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import AccountEcosystem from "./AccountEcosystem";
import ActivityPanel from "./ActivityPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import CalendarPanel from "./CalendarPanel";
import CompetitorsPanel from "./CompetitorsPanel";
import ComposePost from "./ComposePost";
import DashboardStats from "./DashboardStats";
import FeedSection from "./FeedSection";
import InboxPanel from "./InboxPanel";
import LiveContentStream from "./LiveContentStream";
import SchedulerPanel from "./SchedulerPanel";
import SidebarNav, { type DashboardTab } from "./SidebarNav";
import SideTray from "./SideTray";
import { PLATFORMS } from "./PlatformIcon";

export default function SocialDashboard({
  initialAccounts,
  apiError = false,
}: {
  initialAccounts: SocialAccount[];
  apiError?: boolean;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [tab, setTab] = useState<DashboardTab>("compose");
  const [trayOpen, setTrayOpen] = useState(false);
  const hasAccounts = accounts.length > 0;
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const unconnected: SocialPlatform[] = PLATFORMS.filter(
    (p) => !connectedPlatforms.has(p.id)
  ).map((p) => p.id);

  const onDisconnected = (id: string) =>
    setAccounts((prev) => prev.filter((x) => x.id !== id));

  const workspace = () => {
    switch (tab) {
      case "inbox":
        return <InboxPanel />;
      case "calendar":
        return <CalendarPanel />;
      case "feeds":
        return <FeedSection accounts={accounts} />;
      case "activity":
        return <ActivityPanel accounts={accounts} />;
      case "scheduler":
        return <SchedulerPanel accounts={accounts} />;
      case "analytics":
        return <AnalyticsPanel />;
      case "competitors":
        return <CompetitorsPanel />;
      case "compose":
      default:
        return <ComposePost accounts={accounts} />;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardStats accounts={accounts} apiError={apiError} />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Vertical navigation */}
        {hasAccounts && (
          <SidebarNav variant="sidebar" active={tab} onSelect={setTab} />
        )}

        {/* Main workspace */}
        <main
          id="dashboard-workspace"
          role="tabpanel"
          aria-label="Dashboard workspace"
          className="min-w-0"
        >
          {hasAccounts && (
            <SidebarNav variant="tabs" active={tab} onSelect={setTab} />
          )}

          {hasAccounts ? (
            workspace()
          ) : (
            <div className="card flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a4 4 0 01-4 4H9a2 2 0 01-2-2v-2m0-10h10a2 2 0 012 2v6a2 2 0 01-2 2H7m0 4H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v3"
                  />
                </svg>
              </span>
              <h2 className="text-lg font-semibold tracking-tight">
                Connect a social account to get started
              </h2>
              <p className="max-w-sm text-sm text-black/60">
                Posts won&apos;t show until you connect at least one account.
                Use the Account Ecosystem panel on the right (or the floating
                button below) to link your first platform.
              </p>
            </div>
          )}
        </main>

        {/* Persistent Account Ecosystem column (xl+) */}
        {hasAccounts && (
          <div className="hidden xl:block">
            <div className="sticky top-6">
              <AccountEcosystem
                accounts={accounts}
                onDisconnected={onDisconnected}
                unconnected={unconnected}
                apiError={apiError}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Content Stream band (full width, below the workspace) */}
      {hasAccounts && tab !== "feeds" && (
        <LiveContentStream accounts={accounts} />
      )}

      {/* Slide-over tray toggle (below xl) */}
      <button
        onClick={() => setTrayOpen(true)}
        aria-label="Open Account Ecosystem tray"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet-500 text-white shadow-lg shadow-accent/40 transition hover:brightness-110 xl:hidden"
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