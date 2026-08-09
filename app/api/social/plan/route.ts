import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUsageReport } from "@/lib/plan-usage";
import { getPlanPrice } from "@/lib/plans";
import { detectCurrency, parseCurrency, type BillingCurrency } from "@/lib/flutterwave";
import { hasPriorPayment } from "@/lib/store";

/**
 * Plan & usage.
 *
 * GET /api/social/plan[?currency=USD|NGN] -> { plan, planId, planExpiresAt,
 * accounts, ... } plus the localized billing price (and first-timer price)
 * for Business and Pro so the UI can show what upgrading costs in the
 * viewer's currency.
 *
 * Plan changes no longer happen here — that's the Flutterwave checkout flow
 * (/api/billing/checkout).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await getUsageReport(user.id);
  const currency: BillingCurrency =
    parseCurrency(req.nextUrl.searchParams.get("currency")) ?? detectCurrency(req);
  const isFirstTimer = !(await hasPriorPayment(user.id));

  return NextResponse.json({
    ...usage,
    currency,
    price: getPlanPrice("pro", currency, false),
    firstTimerPrice: getPlanPrice("pro", currency, true),
    businessPrice: getPlanPrice("business", currency, false),
    businessFirstTimerPrice: getPlanPrice("business", currency, true),
    isFirstTimer,
  });
}
