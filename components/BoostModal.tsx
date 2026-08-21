"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdsAccount, SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";

interface FeedPost {
  id: string;
  content?: string;
  status?: string;
  platforms?: { platform: string; accountId: string }[];
}

interface FeedData {
  posts: FeedPost[];
  stories: unknown[];
}

const GOALS = [
  { id: "engagement", label: "Engagement" },
  { id: "traffic", label: "Traffic" },
  { id: "awareness", label: "Awareness" },
  { id: "video_views", label: "Video views" },
  { id: "lead_generation", label: "Lead generation" },
  { id: "conversions", label: "Conversions" },
  { id: "app_promotion", label: "App promotion" },
] as const;

// Boosts are Meta-only today (facebook / instagram posting accounts).
const BOOSTABLE_PLATFORMS = new Set(["facebook", "instagram"]);

export default function BoostModal({
  postId: initialPostId,
  accounts,
  onClose,
  onCreated,
}: {
  postId?: string;
  accounts: SocialAccount[];
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postId, setPostId] = useState(initialPostId ?? "");
  const [accountId, setAccountId] = useState("");
  const [adAccounts, setAdAccounts] = useState<AdsAccount[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("engagement");
  const [budgetAmount, setBudgetAmount] = useState("5");
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [currency, setCurrency] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const boostable = accounts.filter((a) => BOOSTABLE_PLATFORMS.has(a.platform));

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/feed", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load posts.");
      const data = (await res.json()) as FeedData;
      setPosts(
        (data.posts ?? []).filter(
          (p) =>
            p.status === "published" ||
            p.status === "partial" ||
            p.status === "live"
        )
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load posts.");
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setAccountId("");
    setAdAccounts([]);
  }, [postId]);

  const loadAdsAccounts = useCallback(async (id: string) => {
    setAdsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/ads/accounts?accountId=${id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load ads accounts.");
      }
      const data = await res.json();
      setAdAccounts(data.accounts ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load ads accounts.");
      setAdAccounts([]);
    } finally {
      setAdsLoading(false);
    }
  }, []);

  async function handleConnectAds() {
    const account = boostable.find((a) => a.id === accountId);
    if (!account) return;
    try {
      const res = await fetch("/api/social/ads/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: account.platform, accountId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.alreadyConnected) {
        loadAdsAccounts(accountId);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Couldn't start the ads connection flow. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId || !accountId || !adAccounts.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const selected = adAccounts[0];
      const res = await fetch("/api/social/ads/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          accountId,
          adAccountId: selected.id,
          name: name || `Boost ${new Date().toLocaleDateString()}`,
          goal,
          budgetAmount: Number(budgetAmount),
          budgetType,
          ...(currency ? { currency } : {}),
          ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Boost failed.");
      }
      setDone(true);
      onCreated?.();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Boost failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPost = posts.find((p) => p.id === postId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Boost a post"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/10 bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="space-y-4 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </span>
            <h3 className="text-lg font-semibold tracking-tight">
              Ad created — your boost is on its way
            </h3>
            <p className="text-sm text-black/60">
              Review it in the Campaigns tab once Meta finishes review. You can
              pause it anytime from there.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Boost a post
                </h3>
                <p className="text-xs text-black/50">
                  Turn an already-published post into a paid ad that keeps its
                  engagement.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1 text-black/40 hover:bg-black/5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium text-black/60">Post</span>
              <select
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a published post…</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.content || "(no caption)").slice(0, 80)}
                  </option>
                ))}
              </select>
              {selectedPost && (
                <span className="block text-[11px] text-black/40">
                  {selectedPost.content?.slice(0, 120)}
                </span>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-black/60">
                Social account
              </span>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setAdAccounts([]);
                  if (e.target.value) loadAdsAccounts(e.target.value);
                }}
                required
                disabled={!postId || boostable.length === 0}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select an account…</option>
                {boostable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name ?? a.username ?? a.id}
                  </option>
                ))}
              </select>
              {boostable.length === 0 && (
                <span className="block text-[11px] text-black/50">
                  Boosting needs a connected Facebook or Instagram account.
                </span>
              )}
            </label>

            <div className="space-y-1">
              <span className="text-xs font-medium text-black/60">
                Ads account
              </span>
              {adsLoading ? (
                <div className="h-9 animate-pulse rounded-xl bg-black/5" />
              ) : adAccounts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {adAccounts.map((aa) => (
                    <span
                      key={aa.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-medium"
                      title={aa.unusableReason ?? undefined}
                    >
                      {aa.name} ({aa.id})
                      {aa.currency ? ` · ${aa.currency}` : ""}
                      {aa.selectable === false ? " · not usable" : ""}
                    </span>
                  ))}
                </div>
              ) : accountId ? (
                <div className="space-y-2">
                  <p className="text-xs text-black/50">
                    No ad account linked to this profile yet. Connect one to
                    start boosting.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectAds}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5"
                  >
                    Connect ads account
                  </button>
                </div>
              ) : (
                <p className="text-xs text-black/50">
                  Pick an account above to see its ad accounts.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Boost ${new Date().toLocaleDateString()}`}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">Goal</span>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as typeof goal)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  {GOALS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">
                  Budget amount
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">Type</span>
                <select
                  value={budgetType}
                  onChange={(e) =>
                    setBudgetType(e.target.value as "daily" | "lifetime")
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">
                  Currency (optional)
                </span>
                <input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
                  maxLength={3}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-black/60">
                  End date (optional)
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={
                  submitting || !postId || !accountId || adAccounts.length === 0
                }
                className="flex-1 rounded-xl bg-gradient-to-br from-accent to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? "Boosting…" : "Boost post"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
