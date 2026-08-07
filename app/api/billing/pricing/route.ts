import { NextRequest, NextResponse } from "next/server";
import { detectCurrency, type BillingCurrency } from "@/lib/flutterwave";
import { getPlanPrice, PLANS } from "@/lib/plans";

// GET /api/billing/pricing
// Localized prices for the client UI. Public — it only exposes prices, and
// currency is derived from the request's IP country.
export async function GET(req: NextRequest) {
  const currency: BillingCurrency = detectCurrency(req);
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
