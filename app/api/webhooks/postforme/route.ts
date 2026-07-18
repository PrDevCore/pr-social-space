import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { recordAccountConnected } from "@/lib/store";

/**
 * Server-to-server webhook from Post for Me. Configure this URL
 * (https://yourdomain.com/api/webhooks/postforme) in the Post for Me
 * dashboard and subscribe to `social.account.created` at minimum.
 *
 * This route is intentionally excluded from Clerk auth in middleware.ts —
 * Post for Me calls it directly, there's no logged-in browser session.
 * Instead we verify the payload signature. Check the exact header name /
 * scheme Post for Me shows you in Project Settings > Webhooks and adjust
 * `verifySignature` below to match — this is a standard HMAC-SHA256
 * implementation as a safe default.
 */
function verifySignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.POSTFORME_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured: skip verification (dev only)
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-postforme-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { id: string; platform: string; external_id: string };
  };

  if (event.type === "social.account.created") {
    await recordAccountConnected({
      userId: event.data.external_id, // this is the Clerk userId we passed as external_id
      accountId: event.data.id,
      platform: event.data.platform,
    });
  }

  return NextResponse.json({ received: true });
}
