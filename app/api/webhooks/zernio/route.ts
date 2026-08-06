import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { recordAccountConnected, updatePostStatus } from "@/lib/store";
import { getUserIdForProfileId } from "@/lib/zernio";

/**
 * Server-to-server webhook from Zernio. Configure this URL
 * (https://yourdomain.com/api/webhooks/zernio) in the Zernio dashboard and
 * subscribe to `account.connected` (plus any post.* events you want).
 *
 * This route is intentionally NOT protected by the session middleware —
 * Zernio calls it directly, there's no logged-in browser session. Instead we
 * verify the HMAC-SHA256 payload signature (X-Zernio-Signature header) using
 * ZERNIO_WEBHOOK_SECRET.
 */
function verifySignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.ZERNIO_WEBHOOK_SECRET;
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
  const signature = req.headers.get("x-zernio-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    account?: { accountId: string; profileId: string; platform: string };
    postId?: string;
    status?: string;
    profileId?: string;
    post?: Record<string, unknown>;
    data?: Record<string, unknown>;
  };

  if (event.event === "account.connected" && event.account) {
    const { accountId, profileId, platform } = event.account;
    // The user id is encoded in the profile description (lib/zernio.ts).
    const userId = await getUserIdForProfileId(profileId);
    if (userId) {
      await recordAccountConnected({ userId, accountId, platform });
    }
  }

  // post.* events — keep the local activity feed's status in sync with the
  // platform (e.g. scheduled -> published / failed). Shape-agnostic parsing
  // so we tolerate whatever Zernio's post webhook payload looks like.
  const eventName = (event.event ?? "").toLowerCase();
  if (eventName.includes("post")) {
    const postPayload = (event.post ?? event.data ?? {}) as Record<string, unknown>;
    const postId = (postPayload.id ?? postPayload._id ?? event.postId) as string | undefined;
    const status = (postPayload.status ?? event.status) as string | undefined;
    const profileId =
      (postPayload.profileId ?? event.profileId ?? event.account?.profileId) as string | undefined;

    if (postId && status) {
      if (profileId) {
        const userId = await getUserIdForProfileId(profileId);
        if (userId) await updatePostStatus(postId, status, userId);
      } else {
        // No profileId in the payload: trust the HMAC-verified webhook.
        await updatePostStatus(postId, status);
      }
    }
  }

  return NextResponse.json({ received: true });
}
