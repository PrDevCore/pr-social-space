"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type MenuItem = { label: string; href: string; icon: ReactNode; color: string; glow: string };

const Icon = ({ children }: { children: ReactNode }) => <svg className="relative z-10 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">{children}</svg>;

const menuItems: MenuItem[] = [
  { label: "Home", href: "/dashboard", color: "text-sky-500", glow: "bg-sky-500/15", icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6" /></Icon> },
  { label: "Compose", href: "/dashboard#compose", color: "text-amber-500", glow: "bg-amber-500/15", icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="m14 5 5 5M4 20l3.5-.8L18 8.7a2.1 2.1 0 0 0-3-3L4.8 16.5 4 20Z" /></Icon> },
  { label: "Calendar", href: "/dashboard#calendar", color: "text-emerald-500", glow: "bg-emerald-500/15", icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></Icon> },
  { label: "Updates", href: "/dashboard#activity", color: "text-violet-500", glow: "bg-violet-500/15", icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></Icon> },
  { label: "Profile", href: "/profile", color: "text-rose-500", glow: "bg-rose-500/15", icon: <Icon><circle cx="12" cy="8" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0 1 14 0" /></Icon> },
];

export default function DashboardMenuBar() {
  return (
    <nav aria-label="Quick navigation" className="dashboard-menu-bar rounded-2xl border border-black/10 bg-white/55 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07]">
      <ul className="flex items-center gap-1">
        {menuItems.map(({ label, href, icon, color, glow }) => (
          <li key={label}>
            <Link href={href} className="group relative flex items-center gap-2 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-semibold text-black/55 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white sm:px-3 sm:text-sm">
              <span className={`absolute inset-0 -z-0 scale-75 rounded-xl opacity-0 blur-md transition duration-300 group-hover:scale-100 group-hover:opacity-100 ${glow}`} aria-hidden="true" />
              <span className={`relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5 ${color}`}>{icon}</span>
              <span className="relative z-10 hidden sm:inline">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
