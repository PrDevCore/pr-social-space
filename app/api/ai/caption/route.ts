import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCaption } from "@/lib/gemini";

// Allow longer serverless execution for large media downloads.
export const maxDuration = 60;

// POST /api/ai/caption { mediaUrl?, context? }
// Generates an appropriate caption for the media using Gemini. The image/video
// is fetched server-side (from a Zernio publicUrl or any public URL). Images go
// inline as base64; videos are uploaded to the Gemini Files API — the
// GEMINI_API_KEY never reaches the browser.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mediaUrl?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mediaUrl = body.mediaUrl?.trim();
  if (!mediaUrl) {
    return NextResponse.json(
      { error: "mediaUrl is required." },
      { status: 400 }
    );
  }

  let image: { mimeType: string; data: string } | undefined;
  let video: { mimeType: string; data: Buffer } | undefined;

  try {
    const mediaRes = await fetch(mediaUrl, { cache: "no-store" });
    if (!mediaRes.ok) {
      return NextResponse.json(
        { error: "Couldn't fetch the media for analysis." },
        { status: 422 }
      );
    }
    const buf = Buffer.from(await mediaRes.arrayBuffer());
    const mime =
      mediaRes.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ??
      "";

    if (mime.startsWith("image/")) {
      if (buf.length > 8_000_000) {
        return NextResponse.json(
          { error: "Image is too large for caption generation." },
          { status: 413 }
        );
      }
      image = { mimeType: mime, data: buf.toString("base64") };
    } else if (mime.startsWith("video/")) {
      if (buf.length > 100_000_000) {
        return NextResponse.json(
          { error: "Video is too large (max 100 MB)." },
          { status: 413 }
        );
      }
      video = { mimeType: mime, data: buf };
    } else {
      return NextResponse.json(
        { error: "AI captions work with images or videos." },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error("fetch media for AI:", err);
    return NextResponse.json(
      { error: "Couldn't read the media for analysis." },
      { status: 502 }
    );
  }

  try {
    const caption = await generateCaption({ image, video, context: body.context });
    return NextResponse.json({ caption });
  } catch (err) {
    console.error("gemini caption:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate a caption.";
    return NextResponse.json(
      { error: message },
      { status: err instanceof Error && /API_KEY/.test(message) ? 503 : 502 }
    );
  }
}
