import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyTransaction } from "@/lib/flutterwave";
import {
  activatePlan,
  getPaymentByTxRef,
  markPaymentSuccess,
} from "@/lib/store";

/**
 * GET /api/billing/callback
 * Flutterwave redirects the browser here after checkout (both success and
 * cancel) with ?status=..&tx_ref=..&transaction_id=.. We re-verify the
 * transaction server-side (never trust the redirect alone), confirm the
 * settled amount and currency match the pending record, then activate the
 * plan for 30 days and bounce back to /profile.
 *
 * The webhook route covers async payment methods (bank transfer, USSD);
 * both paths are idempotent via the payment record's status.
 */
function failUrl(req: NextRequest, reason: string) {
  const url = new URL("/profile", req.nextUrl.origin);
  url.searchParams.set("billing", "failed");
  url.searchParams.set("reason", reason);
  return url;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(failUrl(req, "unauthorized"));
  }

  const params = req.nextUrl.searchParams;
  const txRef = params.get("tx_ref") ?? params.get("txRef") ?? "";
  if (!txRef) {
    return NextResponse.redirect(failUrl(req, "missing_ref"));
  }

  try {
    const payment = await getPaymentByTxRef(txRef);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.redirect(failUrl(req, "verification"));
    }

    // The webhook may already have settled this payment (async methods).
    if (payment.status === "success") {
      const ok = new URL("/profile", req.nextUrl.origin);
      ok.searchParams.set("billing", "success");
      return NextResponse.redirect(ok);
    }

    const verified = await verifyTransaction(txRef);
    const matches =
      verified.status === "successful" &&
      Math.abs(verified.amount - payment.amount) < 0.01 &&
      verified.currency === payment.currency;

    if (!matches) {
      return NextResponse.redirect(failUrl(req, "verification"));
    }

    await activatePlan(user.id, payment.planId, 30);
    await markPaymentSuccess(txRef, {
      flutterwaveTransactionId: verified.id,
      settledAt: new Date().toISOString(),
    });

    const ok = new URL("/profile", req.nextUrl.origin);
    ok.searchParams.set("billing", "success");
    return NextResponse.redirect(ok);
  } catch (err) {
    console.error("billing callback error:", err);
    return NextResponse.redirect(failUrl(req, "error"));
  }
}
