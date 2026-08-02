"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Interactive, purely-CSS/JS dashboard mockup used on the landing hero.
 * A browser frame with a working tab switcher (Compose / Inbox / Calendar /
 * Analytics) and animated inline-SVG charts. Purely decorative.
 */

type MockTab = "compose" | "inbox" | "calendar" | "analytics";

const TABS: { id: MockTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "compose",
    label: "Compose",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4l-2 2h-4l-2-2H4" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const PLATFORM_DOTS: { name: string; color: string }[] = [
  { name: "Instagram", color: "bg-pink-500" },
  { name: "X", color: "bg-black" },
  { name: "TikTok", color: "bg-cyan-500" },
  { name: "LinkedIn", color: "bg-blue-600" },
];

function ComposePane() {
  return (
    <div className="flex gap-3">
      <div className="flex-1 space-y-2">
        <div className="rounded-lg border border-black/10 bg-white p-2.5 text-[10px] text-black/50">
          Caption — “Summer drop is live ☀️ Link in bio…”
        </div>
        <div className="flex flex-wrap gap-1">
          {PLATFORM_DOTS.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[9px] font-medium text-black/60"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} />
              {p.name}
            </span>
          ))}
        </div>
        <div className="rounded-lg bg-ink py-1.5 text-center text-[10px] font-semibold text-white">
          Publish now
        </div>
      </div>
      <div className="w-24 shrink-0 space-y-1.5">
        <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-amber-200 to-pink-300" />
        <div className="rounded-full bg-black/5 px-2 py-0.5 text-center text-[8px] text-black/50">
          Live preview
        </div>
      </div>
    </div>
  );
}

function InboxPane() {
  const rows = [
    { who: "@mia.creates", text: "Love the new color palette!", tag: "Comment", dot: "bg-pink-500" },
    { who: "@brandbros", text: "Could you DM me the pricing sheet?", tag: "DM", dot: "bg-blue-600" },
    { who: "@design.daily", text: "Shoutout to @socialhub in todays post!", tag: "Mention", dot: "bg-cyan-500" },
    { who: "@peakcoaching", text: "Is this available for teams?", tag: "DM", dot: "bg-emerald-500" },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div
          key={r.who}
          className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 py-2 hover:border-black/20"
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-[9px] font-semibold ${r.dot}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-medium text-black/80">{r.who}</p>
            <p className="truncate text-[9px] text-black/50">{r.text}</p>
          </div>
          <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-medium text-accent">
            {r.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

function CalendarPane() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const busy = new Set([3, 7, 12, 15, 18, 22, 26]);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[8px] text-black/40">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div
            key={d}
            className={`flex h-7 items-center justify-center rounded text-[9px] ${
              busy.has(d)
                ? "bg-accent/15 font-semibold text-accent"
                : "bg-black/[0.03] text-black/50"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-green-50 px-2 py-1.5 text-[9px] font-medium text-green-700">
        Next best slot: Wed 9:00 AM · engagement +38%
      </div>
    </div>
  );
}

function AnalyticsPane() {
  const bars = [34, 52, 41, 66, 58, 74, 89, 78, 95, 84];
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1">
            <div
              className="landing-bar w-full rounded-t bg-accent"
              style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
            />
          </div>
        ))}
      </div>
      <svg viewBox="0 0 300 60" className="w-full">
        <path
          className="landing-line"
          d="M0,48 C40,42 60,30 90,34 C120,38 140,22 170,20 C200,18 230,26 260,12 C280,4 292,6 300,4"
          fill="none"
          stroke="#3F5BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["Reach", "1.2M"],
          ["Eng. rate", "6.8%"],
          ["Followers", "+9.4k"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white px-2 py-1.5 text-center">
            <p className="text-[8px] text-black/40">{k}</p>
            <p className="text-[11px] font-semibold text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnimatedMockup() {
  const [tab, setTab] = useState<MockTab>("compose");

  return (
    <div className="landing-float">
      <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-2xl shadow-accent/10">
        <div className="flex items-center gap-2 border-b border-black/10 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[10px] text-black/50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            app.socialhub.dev
          </div>
          <Image src="/logo.png" alt="Social Hub" width={18} height={18} className="rounded" />
        </div>

        <div className="flex gap-2 p-2">
          {/* Mini sidebar */}
          <div className="hidden w-16 shrink-0 flex-col items-center gap-1 sm:flex">
            <div className="mb-1 h-8 w-8 rounded-lg bg-accent/15" />
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  tab === t.id
                    ? "bg-ink text-white"
                    : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2">
            {/* Tab pills */}
            <div className="flex gap-1 rounded-xl border border-black/10 bg-white p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                    tab === t.id
                      ? "bg-ink text-white"
                      : "text-black/50 hover:bg-black/5"
                  }`}
                >
                  {t.icon}
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-black/10 bg-paper p-2">
              {tab === "compose" && <ComposePane />}
              {tab === "inbox" && <InboxPane />}
              {tab === "calendar" && <CalendarPane />}
              {tab === "analytics" && <AnalyticsPane />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
