"use client";

import { useCurrency } from "@/components/CurrencyProvider";

export default function RegionToggle() {
  const { currency, detected, setCurrency } = useCurrency();

  const isAuto = currency === detected;
  const toggle = () => setCurrency(currency === "USD" ? "NGN" : currency === "NGN" ? "GBP" : "USD");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Currency: ${currency}${isAuto ? " (auto)" : ""}. Click to cycle between USD, NGN and GBP.`}
      title={isAuto ? `Currency: ${currency} (detected for your region). Click to switch.` : `Currency: ${currency}. Click to switch back to ${detected}.`}
      className="flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2.5 text-xs font-semibold text-black/70 transition hover:bg-black/5 hover:text-black dark:border-white/15"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 100-18 9 9 0 000 18zm-9-9h18m-9 9c2.5-2 4-4.5 4-9s-1.5-7-4-9c-2.5 2-4 4.5-4 9s1.5 7 4 9z"
        />
      </svg>
      <span>{isAuto ? `${currency} · auto` : currency}</span>
    </button>
  );
}