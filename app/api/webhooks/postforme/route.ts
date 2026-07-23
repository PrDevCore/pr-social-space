import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { recordAccountConnected } from "@/lib/store";

function verifySignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.POSTFORME_WEBHOOK_SECRET;
  if (!secret) return true;
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
      userId: event.data.external_id,
      accountId: event.data.id,
      platform: event.data.platform,
    });
  }

  return NextResponse.json({ received: true });
}
