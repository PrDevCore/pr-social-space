"use client";

import type { ReactNode } from "react";

export type DashboardTab =
  | "compose"
  | "inbox"
  | "calendar"
  | "feeds"
  | "activity"
  | "scheduler"
  | "analytics"
  | "competitors";

export const TABS: { id: DashboardTab; label: string; icon: ReactNode }[] = [
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

function TabButton({
  item,
  active,
  onSelect,
  className,
}: {
  item: { id: DashboardTab; label: string; icon: ReactNode };
  active: boolean;
  onSelect: (id: DashboardTab) => void;
  className: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${item.id}`}
      onClick={() => onSelect(item.id)}
      aria-selected={active}
      aria-controls="dashboard-workspace"
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-br from-accent to-violet-500 text-white shadow-md shadow-accent/30"
          : "text-black/60 hover:bg-black/5 hover:text-black"
      } ${className}`}
    >
      {item.icon}
      {item.label}
    </button>
  );
}

/** Responsive nav: vertical sticky sidebar on lg+, horizontal scroller below. */
export default function SidebarNav({
  active,
  onSelect,
  variant,
}: {
  active: DashboardTab;
  onSelect: (id: DashboardTab) => void;
  variant: "sidebar" | "tabs";
}) {
  const style =
    variant === "sidebar"
      ? "hidden self-start rounded-2xl border border-black/10 bg-white p-2 lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-1"
      : "mb-4 flex gap-1 overflow-x-auto rounded-xl border border-black/10 bg-white p-1 lg:hidden";
  return (
    <nav role="tablist" aria-label="Dashboard sections" className={style}>
      {TABS.map((t) => (
        <TabButton
          key={t.id}
          item={t}
          active={active === t.id}
          onSelect={onSelect}
          className=""
        />
      ))}
    </nav>
  );
}