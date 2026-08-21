"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdCampaign, SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";
import BoostModal from "./BoostModal";

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "paused":
      return "bg-amber-100 text-amber-700";
    case "pending_review":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-black/5 text-black/60";
    case "rejected":
    case "error":
      return "bg-red-100 text-red-700";
    default:
      return "bg-black/5 text-black/60";
  }
}

function fmtCurrency(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function fmtInt(n?: number) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

export default function CampaignsPanel({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boostOpen, setBoostOpen] = useState(false);
  const [busyAd, setBusyAd] = useState<string | null>(null);

  const metaAccounts = accounts.filter((a) =>
    ["facebook", "instagram"].includes(a.platform)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/ads/campaigns", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load campaigns.");
      }
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(c: AdCampaign) {
    const next = c.status === "active" ? "paused" : "active";
    setBusyAd(c.platformCampaignId);
    setError(null);
    try {
      const res = await fetch(
        `/api/social/ads/campaigns/${encodeURIComponent(
          c.platformCampaignId
        )}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update campaign.");
      }
      load();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update campaign.");
    } finally {
      setBusyAd(null);
    }
  }

  async function handleConnectAds(account: SocialAccount) {
    try {
      const res = await fetch("/api/social/ads/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: account.platform, accountId: account.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.alreadyConnected) {
        setError("Ads already connected for this account.");
        load();
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Couldn't start the ads connection flow. Please try again.");
    }
  }

  return (
    <section className="card space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Campaigns</h2>
          <p className="text-xs text-black/50">
            Boost published posts into paid ads. Review, pause and track them
            here.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBoostOpen(true)}
            disabled={metaAccounts.length === 0}
            className="rounded-xl bg-gradient-to-br from-accent to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:brightness-110 disabled:opacity-50"
          >
            Boost a post
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {metaAccounts.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50">
            Ads connections
          </h3>
          <div className="flex flex-wrap gap-2">
            {metaAccounts.map((a) => (
              <button
                key={a.id}
                onClick={() => handleConnectAds(a)}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5"
              >
                <PlatformBadge platform={a.platform} />
                {a.display_name ?? a.username ?? a.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 p-8 text-center text-sm text-black/50">
          No campaigns yet. Boost a published post to create your first ad
          campaign.
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li
              key={c.platformCampaignId}
              className="rounded-xl border border-black/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {c.campaignName}
                    </span>
                    <span className="text-[11px] text-black/40">
                      {c.adCount} ad{c.adCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-black/40">
                    {(c.budget?.amount ?? c.campaignBudget?.amount) !== undefined
                      ? `${(c.budget ?? c.campaignBudget)?.type ?? ""} budget: ${fmtCurrency(
                          (c.budget ?? c.campaignBudget)?.amount
                        )}${c.currency ? ` ${c.currency}` : ""}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-black/5 px-2 py-1.5">
                  <p className="text-sm font-semibold">{fmtCurrency(c.metrics?.spend)}</p>
                  <p className="text-[10px] text-black/50">Spend</p>
                </div>
                <div className="rounded-lg bg-black/5 px-2 py-1.5">
                  <p className="text-sm font-semibold">{fmtInt(c.metrics?.impressions)}</p>
                  <p className="text-[10px] text-black/50">Impressions</p>
                </div>
                <div className="rounded-lg bg-black/5 px-2 py-1.5">
                  <p className="text-sm font-semibold">{fmtInt(c.metrics?.reach)}</p>
                  <p className="text-[10px] text-black/50">Reach</p>
                </div>
                <div className="rounded-lg bg-black/5 px-2 py-1.5">
                  <p className="text-sm font-semibold">{fmtInt(c.metrics?.clicks)}</p>
                  <p className="text-[10px] text-black/50">Clicks</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => toggleStatus(c)}
                  disabled={!!busyAd}
                  className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
                >
                  {busyAd === c.platformCampaignId
                    ? "Updating…"
                    : c.status === "active"
                      ? "Pause"
                      : "Resume"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {boostOpen && (
        <BoostModal
          accounts={accounts}
          onClose={() => setBoostOpen(false)}
          onCreated={load}
        />
      )}
    </section>
  );
}
