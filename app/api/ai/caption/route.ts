import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCaption } from "@/lib/gemini";

// POST /api/ai/caption { mediaUrl?, context? }
// Generates an appropriate caption for the media using Gemini. The image is
// fetched server-side (from a Zernio publicUrl or any public URL) and sent to
// Gemini as inline data — the GEMINI_API_KEY never reaches the browser.
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

  let image: { mimeType: string; data: string } | undefined;
  if (mediaUrl) {
    try {
      const imgRes = await fetch(mediaUrl, { cache: "no-store" });
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: "Couldn't fetch the media for analysis." },
          { status: 422 }
        );
      }
      const buf = await imgRes.arrayBuffer();
      const mimeType =
        imgRes.headers.get("content-type")?.split(";")[0]?.trim() ||
        "image/jpeg";
      if (!mimeType.startsWith("image/")) {
        return NextResponse.json(
          { error: "AI captions work with images, not this media type." },
          { status: 422 }
        );
      }
      const b64 = Buffer.from(buf).toString("base64");
      if (b64.length > 5_000_000) {
        return NextResponse.json(
          { error: "Image is too large for caption generation." },
          { status: 413 }
        );
      }
      image = { mimeType, data: b64 };
    } catch (err) {
      console.error("fetch media for AI:", err);
      return NextResponse.json(
        { error: "Couldn't read the media for analysis." },
        { status: 502 }
      );
    }
  }

  try {
    const caption = await generateCaption({ image, context: body.context });
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
