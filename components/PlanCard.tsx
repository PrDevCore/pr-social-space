"use client";

import { useCallback, useEffect, useState } from "react";
import { PLANS, type Plan, type PlanId } from "@/lib/plans";

interface UsageResponse {
  plan: Plan;
  accounts: number;
  maxAccounts: number | null;
  postsThisMonth: number;
  maxPostsPerMonth: number | null;
}

function UsageBar({ label, value, max }: { label: string; value: number; max: number | null }) {
  const pct = max === null ? 100 : Math.min(100, (value / max) * 100);
  const over = max !== null && value >= max;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-black/50">{label}</span>
        <span className={over ? "font-medium text-red-500" : "text-black/50"}>
          {value}
          {max !== null ? ` / ${max}` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-accent"}`}
          style={{ width: max === null ? "100%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PlanCard() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/plan", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load plan");
      setUsage(await res.json());
    } catch {
      setError("Couldn't load your plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upgrade = async (planId: PlanId) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/social/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error("Upgrade failed");
      setUsage(await res.json());
      setShowPicker(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 rounded bg-black/5" />
        <div className="mt-3 space-y-2">
          <div className="h-3 rounded bg-black/5" />
          <div className="h-3 rounded bg-black/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">Plan</h2>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
          {usage?.plan.name ?? "Free"}
        </span>
      </div>

      <p className="mt-2 text-sm text-black/50">
        {usage?.plan.tagline}
      </p>
      <p className="mt-1 text-2xl font-semibold">
        ${usage?.plan.monthlyPrice ?? "Custom"}
        <span className="text-sm font-normal text-black/40">
          {usage?.plan.monthlyPrice ? "/mo" : ""}
        </span>
      </p>

      <div className="mt-4 space-y-3">
        <UsageBar
          label="Connected accounts"
          value={usage?.accounts ?? 0}
          max={usage?.maxAccounts ?? null}
        />
        <UsageBar
          label="Posts this month"
          value={usage?.postsThisMonth ?? 0}
          max={usage?.maxPostsPerMonth ?? null}
        />
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {usage?.plan.features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-center gap-2 text-black/60">
            <span className="text-accent">✓</span> {f}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {!showPicker ? (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="btn-primary mt-4 w-full"
        >
          {usage?.plan.id === "team" ? "Current plan" : "Upgrade"}
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-black/50">Pick a plan to switch to (demo):</p>
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy || p.id === usage?.plan.id}
              onClick={() => upgrade(p.id)}
              className="btn-secondary w-full justify-between"
            >
              <span className="capitalize">{p.name}</span>
              <span className="text-black/40">
                {p.monthlyPrice === null ? "Custom" : `$${p.monthlyPrice}/mo`}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="w-full py-1 text-xs text-black/40 hover:text-black/60"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
