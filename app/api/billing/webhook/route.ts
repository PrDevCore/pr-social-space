import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookHash } from "@/lib/flutterwave";
import {
  activatePlan,
  getPaymentByTxRef,
  markPaymentSuccess,
} from "@/lib/store";

/**
 * Server-to-server webhook from Flutterwave. Configure this URL
 * (https://yourdomain.com/api/billing/webhook) in the Flutterwave dashboard
 * under Settings -> Webhooks. The payload is signed with a `verif-hash`
 * header equal to the Secret Hash set there (FLW_WEBHOOK_HASH).
 *
 * This route is intentionally NOT protected by the session middleware —
 * Flutterwave calls it directly. We verify the hash and then settle the
 * matching pending checkout. Covers async payment methods (bank transfer,
 * USSD, ...) that resolve after the browser left the callback. Idempotent:
 * a payment already marked success is never activated twice.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hash = req.headers.get("verif-hash");

  if (!verifyWebhookHash(rawBody, hash)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      tx_ref?: string;
      status?: string;
      id?: string | number;
    };
  };

  const data = event.data ?? {};
  if (
    event.event === "charge.completed" &&
    data.status === "successful" &&
    data.tx_ref
  ) {
    try {
      const txRef = data.tx_ref;
      const payment = await getPaymentByTxRef(txRef);
      if (payment && payment.status !== "success") {
        await activatePlan(payment.userId, payment.planId, 30);
        await markPaymentSuccess(txRef, {
          flutterwaveTransactionId: String(data.id ?? ""),
          settledAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("billing webhook activate failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
