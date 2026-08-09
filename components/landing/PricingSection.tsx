"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrency, type Currency } from "@/components/CurrencyProvider";

interface PlanPricing {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  price: number | null;
  firstTimerPrice: number | null;
}

function formatPrice(currency: Currency, amount: number | null) {
  if (amount === null) return "Custom";
  if (amount === 0) return "Free";
  const symbol = currency === "NGN" ? "₦" : "$";
  const value = currency === "NGN" ? amount.toLocaleString() : amount;
  return `${symbol}${value}`;
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingSection() {
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<PlanPricing[] | null>(null);

  useEffect(() => {
    let active = true;
    setPlans(null);
    fetch(`/api/billing/pricing?currency=${currency}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => active && setPlans(d.plans as PlanPricing[]))
      .catch(() => active && setPlans([]));
    return () => {
      active = false;
    };
  }, [currency]);

  if (!plans) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-72 animate-pulse">
            <div className="h-4 w-24 rounded bg-black/5" />
            <div className="mt-3 h-3 rounded bg-black/5" />
            <div className="mt-6 h-10 rounded bg-black/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const highlighted = plan.id === "free";
        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              highlighted
                ? "border-accent bg-white shadow-xl shadow-accent/10"
                : "border-black/10 bg-white"
            }`}
          >
            {highlighted && (
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                Get started
              </span>
            )}
            <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
            <p className="mt-1 text-sm text-black/50">{plan.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{formatPrice(currency, plan.price)}</span>
              {plan.price !== null && plan.price > 0 && (
                <span className="text-sm text-black/40">/mo</span>
              )}
            </div>
            {plan.id === "pro" && (
              <p className="mt-1 text-xs font-medium text-green-600">
                First month {formatPrice(currency, plan.firstTimerPrice)}
              </p>
            )}
            {plan.id === "team" && (
              <p className="mt-1 text-xs text-black/40">contact us</p>
            )}

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-black/70">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className={`block w-full ${highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {highlighted ? "Start free" : "Upgrade"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}