import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adjustTone, generateHashtags, type ToneId } from "@/lib/groq";

/**
 * AI writing assistant.
 * POST /api/ai/write { action, ... }
 *   action: "hashtags" -> { content, count? } -> { hashtags: string[] }
 *   action: "tone"     -> { text, platform, tone } -> { text: string }
 */
export const maxDuration = 60;

const TONES: ToneId[] = ["casual", "professional", "playful"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action as string;

  try {
    if (action === "hashtags") {
      const content = String(body.content ?? "").trim();
      if (!content) {
        return NextResponse.json({ error: "content is required" }, { status: 400 });
      }
      const count = Math.min(Math.max(Number(body.count) || 8, 3), 15);
      const hashtags = await generateHashtags(content, count);
      return NextResponse.json({ hashtags });
    }

    if (action === "tone") {
      const text = String(body.text ?? "").trim();
      const platform = String(body.platform ?? "social");
      const tone = body.tone as ToneId;
      if (!text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }
      if (!TONES.includes(tone)) {
        return NextResponse.json({ error: "tone must be casual | professional | playful" }, { status: 400 });
      }
      const rewritten = await adjustTone(text, platform, tone);
      return NextResponse.json({ text: rewritten });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "AI request failed";
    if (/GROQ_API_KEY is not set/.test(msg)) {
      return NextResponse.json(
        { error: "AI writing is not configured. Set GROQ_API_KEY in your environment to enable it." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: 502 });
  }
}
