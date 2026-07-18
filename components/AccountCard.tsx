"use client";

import { useState } from "react";
import type { SocialAccount } from "@/lib/postforme";
import { PlatformBadge } from "./PlatformIcon";

export default function AccountCard({
  account,
  onDisconnected,
}: {
  account: SocialAccount;
  onDisconnected: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

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
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <PlatformBadge platform={account.platform} />
        <div>
          <p className="text-sm font-medium">
            {account.display_name ?? account.username ?? account.id}
          </p>
          {account.username && (
            <p className="text-xs text-black/50">@{account.username}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleDisconnect}
        disabled={busy}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {busy ? "…" : "Disconnect"}
      </button>
    </div>
  );
}
