import "server-only";
import Groq from "groq-sdk";

/**
 * Server-only Groq client for generating post captions, hashtags, and tone
 * adjustments. The GROQ_API_KEY must never reach the browser.
 *
 * NOTE: Groq is text-only (no vision/image analysis). Caption generation
 * works from the context/media description provided by the caller rather
 * than analyzing image/video pixels directly.
 */

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq free-tier models — fast & generous limits
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------------

function buildCaptionPrompt(opts: {
  mediaType?: string;
  context?: string;
}): string {
  const lines = [
    "You are a professional social media manager.",
    `Write ONE engaging, appropriate caption for a ${opts.mediaType ?? "post"}.`,
  ];
  if (opts.context?.trim()) {
    lines.push(`Context to incorporate: ${opts.context.trim()}`);
  }
  lines.push(
    "Rules:",
    "- Match the tone to the content (fun, professional, informative, etc.).",
    "- 1-3 short paragraphs maximum; the caption must be ready to paste.",
    "- End with 3-6 relevant hashtags on a separate line.",
    "- Return ONLY the caption text. No quotes, no prefixes, no commentary."
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------

export interface CaptionInput {
  mediaType?: string; // e.g. "image", "video", or a description
  context?: string;
}

export async function generateCaption(input: CaptionInput): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment to use AI captions."
    );
  }

  const prompt = buildCaptionPrompt({
    mediaType: input.mediaType ?? "media",
    context: input.context,
  });

  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 512,
  });

  const text = res.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty response.");
  return text;
}

/* --------------------------- Text-only helpers --------------------------- */

async function runTextGeneration(
  prompt: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment to use AI writing features."
    );
  }

  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: opts.temperature ?? 0.9,
    max_tokens: opts.maxTokens ?? 512,
  });

  const text = res.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty response.");
  return text;
}

/**
 * Generate hashtags for a post. Returns the tags WITHOUT the leading "#"
 * so the UI can render/insert them however it likes.
 */
export async function generateHashtags(
  content: string,
  count = 8
): Promise<string[]> {
  const prompt = [
    "You are a social media hashtag strategist.",
    `Given this post text, return exactly ${count} relevant hashtags for reach on social platforms.`,
    "Rules:",
    "- Mix broad and niche tags; no spaces or symbols except letters/numbers.",
    "- Do NOT include the leading # character.",
    "- Return ONLY the tags, one per line. No bullets, no commentary, no numbering.",
    "",
    `Post: ${content.slice(0, 2000)}`,
  ].join("\n");

  const raw = await runTextGeneration(prompt, { temperature: 0.8, maxTokens: 160 });
  const tags = raw
    .split(/[\n,]+/)
    .map((t) => t.trim().replace(/^#/, "").replace(/[^\p{L}\p{N}_]/gu, ""))
    .filter((t) => t.length > 0)
    .slice(0, count);
  return tags;
}

export type ToneId = "casual" | "professional" | "playful";

/**
 * Rewrite existing text in a new tone, optimized for a specific platform.
 * Returns a ready-to-paste replacement caption.
 */
export async function adjustTone(
  text: string,
  platform: string,
  tone: ToneId
): Promise<string> {
  const toneGuide: Record<ToneId, string> = {
    casual: "friendly, conversational, uses contractions, feels like a DM from a friend",
    professional: "polished, confident, jargon-free, suitable for a corporate audience",
    playful: "fun, energetic, light-hearted, uses emojis sparingly and punchy phrasing",
  };
  const prompt = [
    "You are a social media copywriter.",
    `Rewrite the following post in a ${tone} tone (${toneGuide[tone]}) for ${platform}.`,
    "Rules:",
    "- Keep the core message and facts intact.",
    "- Match the platform's conventions (character limits, formatting, hashtag style).",
    "- Return ONLY the rewritten post text. No quotes, no prefixes, no commentary.",
    "",
    `Post: ${text.slice(0, 2000)}`,
  ].join("\n");

  return runTextGeneration(prompt, { temperature: 0.8, maxTokens: 512 });
}
