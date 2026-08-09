"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Currency = "USD" | "NGN";

/** Must match lib/flutterwave.ts CURRENCY_COOKIE. */
const CURRENCY_COOKIE = "currency";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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

  // Once mounted, prefer any previously stored choice over the detected region.
  useEffect(() => {
    if (readCookie(CURRENCY_COOKIE) === "NGN") setCurrencyState("NGN");
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
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