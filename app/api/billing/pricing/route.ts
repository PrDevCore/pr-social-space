import { NextRequest, NextResponse } from "next/server";
import { detectCurrency, parseCurrency, type BillingCurrency } from "@/lib/flutterwave";
import { getPlanPrice, PLANS } from "@/lib/plans";

// GET /api/billing/pricing[?currency=USD|NGN]
// Localized prices for the client UI. Public — it only exposes prices.
// Currency comes from an explicit ?currency= param, else the `currency`
// cookie (region toggle), else IP country.
export async function GET(req: NextRequest) {
  const currency: BillingCurrency =
    parseCurrency(req.nextUrl.searchParams.get("currency")) ?? detectCurrency(req);
  return NextResponse.json({
    currency,
    plans: PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      features: p.features,
      price: getPlanPrice(p.id, currency, false),
      firstTimerPrice: getPlanPrice(p.id, currency, true),
    })),
  });
}
