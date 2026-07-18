"use client";

import { useState } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/postforme";
import AccountCard from "./AccountCard";
import ConnectAccountButton from "./ConnectAccountButton";
import ComposePost from "./ComposePost";
import { PLATFORMS } from "./PlatformIcon";

export default function SocialDashboard({
  initialAccounts,
}: {
  initialAccounts: SocialAccount[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const unconnected = PLATFORMS.filter((p) => !connectedPlatforms.has(p.id));

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <section className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
            Connected accounts
          </h2>

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
            <p className="text-sm text-black/50">Nothing connected yet.</p>
          )}
        </div>

        {unconnected.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Connect a platform
            </h2>
            <div className="flex flex-col gap-2">
              {unconnected.map((p) => (
                <ConnectAccountButton key={p.id} platform={p.id as SocialPlatform} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
          Compose
        </h2>
        <ComposePost accounts={accounts} />
      </section>
    </div>
  );
}
