"use client";

import { useCallback, useEffect, useState } from "react";

interface UsageResponse {
  plan: { id: string; name: string; tagline: string; features: string[] };
  planId: "free" | "pro" | "team";
  planExpiresAt: string | null;
  currency: "USD" | "NGN";
  price: number | null;
  firstTimerPrice: number | null;
  isFirstTimer: boolean;
  accounts: number;
  maxAccounts: number | null;
  postsThisMonth: number;
  maxPostsPerMonth: number | null;
}

function formatPrice(currency: "USD" | "NGN", amount: number | null) {
  if (amount === null) return "Custom";
  if (amount === 0) return "Free";
  const symbol = currency === "NGN" ? "₦" : "$";
  const value = currency === "NGN" ? amount.toLocaleString() : amount;
  return `${symbol}${value}`;
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

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PlanCard() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

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

  // Surface the Flutterwave redirect outcome (?billing=success|failed).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (billing === "success") setBanner("Payment successful — Pro is now active. 🎉");
    else if (billing === "failed") setBanner("Payment didn't go through. No charge was made.");
    if (billing) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const upgrade = async () => {
    if (!usage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "pro" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.link;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
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

  const currency = usage?.currency ?? "USD";
  const displayPrice = !usage
    ? null
    : usage.isFirstTimer
      ? usage.firstTimerPrice ?? usage.price
      : usage.price;
  const expired =
    usage?.planId !== "free" &&
    usage?.planExpiresAt &&
    new Date(usage.planExpiresAt).getTime() < Date.now();
  const isTeam = usage?.planId === "team";

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">Plan</h2>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
          {usage?.plan.name ?? "Free"}
          {expired ? " (expired)" : ""}
        </span>
      </div>

      {banner && (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
            banner.startsWith("Payment successful")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {banner}
        </div>
      )}

      <p className="mt-2 text-sm text-black/50">{usage?.plan.tagline}</p>
      <p className="mt-1 text-2xl font-semibold">
        {formatPrice(currency, displayPrice)}
        <span className="text-sm font-normal text-black/40">
          {displayPrice ? "/mo" : ""}
        </span>
      </p>

      {usage?.isFirstTimer && displayPrice !== usage?.price && (
        <p className="mt-1 text-xs font-medium text-green-600">
          First-month promo — {formatPrice(currency, usage.price)} from next month.
        </p>
      )}

      {usage?.planExpiresAt && !expired && usage.planId !== "free" && (
        <p className="mt-1 text-xs text-black/40">Active until {formatExpiry(usage.planExpiresAt)}</p>
      )}

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

      {!isTeam && (
        <button
          type="button"
          disabled={busy}
          onClick={upgrade}
          className="btn-primary mt-4 w-full disabled:opacity-60"
        >
          {busy
            ? "Redirecting to checkout…"
            : usage?.planId === "pro"
              ? `Renew Pro — ${formatPrice(currency, displayPrice)}/mo`
              : `Upgrade to Pro — ${formatPrice(currency, displayPrice)}/mo`}
        </button>
      )}
      {isTeam && (
        <button type="button" disabled className="btn-secondary mt-4 w-full disabled:opacity-60">
          Current plan
        </button>
      )}

      <p className="mt-3 text-xs leading-relaxed text-black/40">
        Payments are processed securely by Flutterwave. Each payment activates Pro for 30
        days; your account returns to Free automatically when it lapses.
      </p>
    </div>
  );
}
