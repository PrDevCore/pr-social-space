"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Currency = "USD" | "NGN" | "GBP";

/** Must match lib/flutterwave.ts CURRENCY_COOKIE. */
const CURRENCY_COOKIE = "currency";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const isCurrency = (v: string | undefined | null): v is Currency =>
  v === "USD" || v === "NGN" || v === "GBP";

interface CurrencyContextValue {
  /** The visitor's chosen currency (falls back to the detected region). */
  currency: Currency;
  /** The currency detected automatically from the visitor's region. */
  detected: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function CurrencyProvider({
  children,
  defaultCurrency,
}: {
  children: ReactNode;
  /** Server-detected currency so the first paint matches the visitor's region. */
  defaultCurrency: Currency;
}) {
  const [detected] = useState<Currency>(defaultCurrency);
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency);

  // Once mounted:
  // 1. Prefer any previously stored cookie choice over the detected region.
  // 2. For signed-in users, also restore their saved currency preference
  //    (persisted across devices) into both state and the cookie.
  useEffect(() => {
    const saved = readCookie(CURRENCY_COOKIE);
    let applied = false;
    if (isCurrency(saved)) {
      setCurrencyState(saved);
      applied = true;
    }
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const preferred = data?.user?.preferredCurrency;
        if (isCurrency(preferred)) {
          setCurrencyState(preferred);
          document.cookie = `${CURRENCY_COOKIE}=${preferred}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
        } else if (!applied && isCurrency(saved)) {
          document.cookie = `${CURRENCY_COOKIE}=${saved}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    // Persist the preference for signed-in users (fire-and-forget).
    fetch("/api/auth/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: c }),
    }).catch(() => {});
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, detected, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a <CurrencyProvider>");
  return ctx;
}