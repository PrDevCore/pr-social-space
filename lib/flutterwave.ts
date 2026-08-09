import "server-only";
import crypto from "crypto";

/**
 * Thin server-side client for the Flutterwave V3 API (billing).
 *
 * This file is the ONLY place FLW_SECRET_KEY is used. It must never be
 * imported from a client component. All routes under app/api/billing/*
 * call through here on behalf of the signed-in user.
 *
 * Billing model: one-time payments that activate a plan for a fixed period
 * (30 days). Currency is picked by the buyer's country (NG -> NGN, else
 * USD). New members pay a discounted first purchase price.
 */

const API_BASE = "https://api.flutterwave.com/v3";
const SECRET_KEY = process.env.FLW_SECRET_KEY;
const WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH;

export type BillingCurrency = "USD" | "NGN";

function assertConfigured() {
  if (!SECRET_KEY) {
    throw new Error(
      "FLW_SECRET_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
}

async function flutterwaveFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertConfigured();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as { status?: string }).status !== "success") {
    throw new Error(
      `Flutterwave API error ${res.status} on ${path}: ${(data as { message?: string }).message || res.statusText}`
    );
  }
  return data as T;
}

/* ------------------------------ Currency -------------------------------- */

/** Cookie name holding the buyer's explicit region/currency choice. */
export const CURRENCY_COOKIE = "currency";

/** Validate/coerce an arbitrary token into a supported currency, or null. */
export function parseCurrency(value: string | null | undefined): BillingCurrency | null {
  const v = value?.trim().toUpperCase();
  return v === "NGN" || v === "USD" ? v : null;
}

function readCookie(headerCookie: string | null | undefined, name: string): string | undefined {
  if (!headerCookie) return undefined;
  for (const part of headerCookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

/**
 * Pick the billing currency for a request. Resolution order:
 *   1. The user's explicit choice (the `currency` cookie set by the region
 *      toggle) — this lets visitors pick USD or NGN regardless of location.
 *   2. FLW_CURRENCY env override (local dev).
 *   3. Country headers (Vercel x-vercel-ip-country). Nigeria -> NGN, else USD.
 */
export function detectCurrency(req: { headers: Headers }): BillingCurrency {
  const fromCookie = parseCurrency(readCookie(req.headers.get("cookie"), CURRENCY_COOKIE));
  if (fromCookie) return fromCookie;
  const override = process.env.FLW_CURRENCY?.trim().toUpperCase();
  if (override === "NGN" || override === "USD") return override;
  const country = (
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  return country === "NG" ? "NGN" : "USD";
}

/* ----------------------------- Payments -------------------------------- */

export interface PaymentCustomer {
  email: string;
  name?: string;
}

export interface PaymentInit {
  txRef: string;
  amount: number;
  currency: BillingCurrency;
  customer: PaymentCustomer;
  redirectUrl: string;
  title?: string;
  description?: string;
}

/**
 * POST /v3/payments — create a hosted checkout session. Flutterwave
 * redirects the buyer to `link`, and back to `redirectUrl` afterwards with
 * status + tx_ref query params.
 */
export async function initiatePayment(
  params: PaymentInit
): Promise<{ link: string; transactionId: string }> {
  const data = await flutterwaveFetch<{
    data: { link?: string; id?: string | number };
    message?: string;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: { email: params.customer.email, name: params.customer.name },
      customizations: {
        title: params.title ?? "Social Hub membership",
        description: params.description ?? "Social Hub membership — 30 days",
      },
    }),
  });
  if (!data.data?.link) {
    throw new Error(`Flutterwave did not return a checkout link: ${data.message}`);
  }
  return { link: data.data.link, transactionId: String(data.data.id ?? "") };
}

export interface VerifiedTransaction {
  id: string;
  txRef: string;
  /** "successful" | "pending" | "failed" | ... */
  status: string;
  amount: number;
  currency: string;
}

/** GET /v3/transactions/{tx_ref}/verify — confirm a payment really settled. */
export async function verifyTransaction(txRef: string): Promise<VerifiedTransaction> {
  const data = await flutterwaveFetch<{ data?: Record<string, unknown> }>(
    `/transactions/${encodeURIComponent(txRef)}/verify`
  );
  const d = data.data ?? {};
  return {
    id: String(d.id ?? ""),
    txRef: (d.tx_ref as string) ?? txRef,
    status: String(d.status ?? ""),
    amount: Number(d.amount ?? 0),
    currency: String(d.currency ?? ""),
  };
}

/* ------------------------------- Webhooks ------------------------------- */

/**
 * Flutterwave signs webhook POSTs with a `verif-hash` header whose value is
 * the Secret Hash you set in the dashboard (Settings -> Webhooks). It's a
 * plain shared secret, not a signature over the body, so we compare it in
 * constant time. If FLW_WEBHOOK_HASH is not configured we skip the check
 * (dev only), mirroring the Zernio webhook.
 */
export function verifyWebhookHash(_rawBody: string, header: string | null): boolean {
  if (!WEBHOOK_HASH) return true;
  if (!header) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(header),
      Buffer.from(WEBHOOK_HASH)
    );
  } catch {
    return false;
  }
}
