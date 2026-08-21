"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaymentHistoryEntry } from "@/lib/store";

function formatPrice(currency: string, amount: number) {
  const symbol =
    currency === "NGN" ? "₦" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${symbol}${amount.toLocaleString()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/history", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load payment history.");
      const data = await res.json();
      setPayments(data.payments ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load payment history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="h-16 animate-pulse rounded-xl bg-black/5" />;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Payment history
        </h2>
        <button
          onClick={load}
          className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5"
        >
          Refresh
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {!error && payments.length === 0 && (
        <p className="mt-3 text-sm text-black/50">
          No payments yet. Upgrading to Business or Pro will appear here.
        </p>
      )}

      {payments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {payments.map((p) => (
            <li
              key={p.txRef}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium capitalize">
                  {p.planId}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      p.status === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </p>
                <p className="truncate font-mono text-[11px] text-black/40">
                  {p.txRef}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">
                  {formatPrice(p.currency, p.amount)}
                </p>
                <p className="text-[11px] text-black/40">
                  {formatDate(p.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}