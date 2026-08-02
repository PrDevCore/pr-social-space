"use client";

import { useState } from "react";
import type { SocialAccount } from "@/lib/zernio";
import { PlatformBadge, PLATFORMS } from "./PlatformIcon";

export default function AccountCard({
  account,
  onDisconnected,
}: {
  account: SocialAccount;
  onDisconnected: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const meta = PLATFORMS.find((p) => p.id === account.platform);
  const initials = (account.display_name ?? account.username ?? account.id)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleDisconnect() {
    if (!confirm(`Disconnect @${account.username ?? account.id}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/social/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDisconnected(account.id);
    } catch (err) {
      console.error(err);
      alert("Couldn't disconnect that account.");
      setBusy(false);
    }
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 transition hover:border-black/20 hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          {account.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.avatar_url}
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: meta?.color ?? "#333" }}
            >
              {initials}
            </span>
          )}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
            title="Connected"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {account.profile_url ? (
              <a
                href={account.profile_url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {account.display_name ?? account.username ?? account.id}
              </a>
            ) : (
              account.display_name ?? account.username ?? account.id
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <PlatformBadge platform={account.platform} />
            {account.username && (
              <p className="truncate text-xs text-black/50">@{account.username}</p>
            )}
          </div>
          {account.followers_count != null && (
            <p className="text-[11px] text-black/40">
              {account.followers_count.toLocaleString()} followers
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleDisconnect}
        disabled={busy}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-black/40 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        title="Disconnect"
      >
        {busy ? "…" : "Disconnect"}
      </button>
    </div>
  );
}
