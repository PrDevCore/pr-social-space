import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPost, ensureProfileForUser, listAccounts, presignMedia } from "@/lib/zernio";
import { listPostsForUser, recordPost } from "@/lib/store";
import { checkPostLimit } from "@/lib/plan-usage";
import { autoCropForInstagram, needsInstagramCrop, type ContentType } from "@/lib/image-utils";

// GET /api/social/posts — this user's post history from our own backend.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await listPostsForUser(user.id);
  return NextResponse.json({ posts });
}

// POST /api/social/posts { caption, socialAccountIds, mediaUrls?, scheduledAt?, contentType? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    caption?: string;
    socialAccountIds?: string[];
    mediaUrls?: string[];
    scheduledAt?: string;
    hashtags?: string[];
    contentType?: ContentType;
  };

  if (!body.caption || !body.socialAccountIds?.length) {
    return NextResponse.json(
      { error: "caption and socialAccountIds are required" },
      { status: 400 }
    );
  }

  const contentType = body.contentType ?? "feed";

  try {
    // Plan cap: Free users may publish up to their plan's monthly post limit.
    const postLimit = await checkPostLimit(user.id);
    if (!postLimit.ok) {
      return NextResponse.json(
        {
          error: postLimit.error,
          code: "plan_limit_reached",
          plan: postLimit.plan.id,
        },
        { status: 403 }
      );
    }

    const profileId = await ensureProfileForUser(user.id);
    // Ownership check: only allow posting to accounts this user connected.
    const ownedAccounts = await listAccounts(profileId);
    const ownedById = new Map(ownedAccounts.map((a) => [a.id, a]));
    const unauthorized = body.socialAccountIds.filter((id) => !ownedById.has(id));
    if (unauthorized.length) {
      return NextResponse.json(
        { error: `Not your accounts: ${unauthorized.join(", ")}` },
        { status: 403 }
      );
    }

    // Auto-crop images for Instagram feed if they don't fit aspect ratio
    const processedMediaUrls: string[] = [];
    for (const url of body.mediaUrls ?? []) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
      if (isImage && contentType === "feed") {
        try {
          const imgRes = await fetch(url, { cache: "no-store" });
          if (imgRes.ok) {
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            const mime = imgRes.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";

            // Check dimensions using sharp metadata
            const sharp = (await import("sharp")).default;
            const meta = await sharp(imgBuf).metadata();
            if (meta.width && meta.height && needsInstagramCrop(meta.width, meta.height, "feed")) {
              // Auto-crop to 4:5
              const { buffer, contentType: outMime } = await autoCropForInstagram(imgBuf, mime, "feed");
              // Re-upload cropped image to Zernio
              const ext = outMime === "image/png" ? "png" : "jpg";
              const { uploadUrl, publicUrl } = await presignMedia({
                filename: `cropped-${Date.now()}.${ext}`,
                contentType: outMime,
              });
              await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": outMime },
                body: new Uint8Array(buffer),
              });
              processedMediaUrls.push(publicUrl);
              continue;
            }
          }
        } catch (cropErr) {
          console.warn("Auto-crop failed, using original:", cropErr);
        }
      }
      processedMediaUrls.push(url);
    }

    const result = await createPost({
      content: body.caption,
      profileId,
      targets: body.socialAccountIds.map((id) => ({
        accountId: id,
        platform: ownedById.get(id)!.platform,
      })),
      mediaUrls: processedMediaUrls.length ? processedMediaUrls : body.mediaUrls,
      scheduledAt: body.scheduledAt,
      hashtags: body.hashtags,
      contentType,
    });

    await recordPost({
      id: result.id,
      userId: user.id,
      caption: body.caption,
      socialAccountIds: body.socialAccountIds,
      status: result.status,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 502 });
  }
}
