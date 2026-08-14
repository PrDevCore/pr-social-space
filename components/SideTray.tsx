"use client";

import { useEffect } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import AccountEcosystem from "./AccountEcosystem";

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
      className={`fixed inset-0 z-50 xl:hidden ${open ? "" : "pointer-events-none"}`}
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
            Account Ecosystem
          </h2>
          <button
            onClick={onClose}
            aria-label="Close side tray"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition hover:bg-black/5 hover:text-black"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <AccountEcosystem
          accounts={accounts}
          onDisconnected={onDisconnected}
          unconnected={unconnected}
        />
      </aside>
    </div>
  );
}