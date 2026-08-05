import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCaption } from "@/lib/groq";

export const maxDuration = 60;

// POST /api/ai/caption { context? }
// Generates a caption using Groq AI. The context describes the post content.
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

  // Determine media type from URL extension for better captions
  const mediaUrl = body.mediaUrl?.trim();
  let mediaType = "post";
  if (mediaUrl) {
    const ext = mediaUrl.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      mediaType = "image";
    } else if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
      mediaType = "video";
    }
  }

  try {
    const caption = await generateCaption({
      mediaType,
      context: body.context,
    });
    return NextResponse.json({ caption });
  } catch (err) {
    console.error("groq caption:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate a caption.";
    return NextResponse.json(
      { error: message },
      { status: err instanceof Error && /API_KEY/.test(message) ? 503 : 502 }
    );
  }
}
