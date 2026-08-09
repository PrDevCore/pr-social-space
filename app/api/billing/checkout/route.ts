import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  detectCurrency,
  initiatePayment,
  type BillingCurrency,
} from "@/lib/flutterwave";
import { getPlan, getPlanPrice, type PlanId } from "@/lib/plans";
import { hasPriorPayment, recordPayment } from "@/lib/store";

// POST /api/billing/checkout { planId: "business" | "pro" }
// Starts a Flutterwave hosted checkout for the signed-in user.
//   - Currency is picked by IP country (NG -> NGN, else USD).
//   - New members (no prior successful payment) get the first-timer price.
//   - A pending payment record is stored so the callback/webhook can verify
//     the amount, currency and tx_ref before activating the plan.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { planId?: string };
  const planId = body.planId as PlanId | undefined;
  const plan = getPlan(planId);
  if (["free", "team"].includes(plan.id)) {
    return NextResponse.json(
      { error: "This plan isn't purchasable through checkout." },
      { status: 400 }
    );
  }

  const currency: BillingCurrency = detectCurrency(req);
  const isFirstTimer = !(await hasPriorPayment(user.id));
  const amount = getPlanPrice(plan.id, currency, isFirstTimer);
  if (amount === null || amount <= 0) {
    return NextResponse.json(
      { error: "This plan isn't purchasable through checkout." },
      { status: 400 }
    );
  }

  const txRef = `sh_${user.id.slice(-8)}_${plan.id}_${Date.now()}`;
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
  const redirectUrl = `${appUrl}/api/billing/callback`;

  try {
    await recordPayment({
      txRef,
      userId: user.id,
      planId: plan.id,
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const { link } = await initiatePayment({
      txRef,
      amount,
      currency,
      customer: { email: user.email, name: user.name },
      redirectUrl,
      title: `Social Hub ${plan.name}`,
      description: "Social Hub membership — 30 days",
    });

    return NextResponse.json({
      link,
      txRef,
      planId,
      amount,
      currency,
      isFirstTimer,
    });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json(
      { error: "Failed to start checkout. Is FLW_SECRET_KEY set?" },
      { status: 502 }
    );
  }
}
