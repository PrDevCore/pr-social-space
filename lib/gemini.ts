import "server-only";

/**
 * Server-only Gemini client for generating post captions.
 * The GEMINI_API_KEY must never reach the browser; the /api/ai/caption route
 * calls through here on behalf of the signed-in user.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  `${MODEL}:generateContent`;

function buildPrompt(opts: { hasImage: boolean; context?: string }): string {
  const lines = [
    "You are a professional social media manager.",
    "Write ONE engaging, appropriate caption for the attached media.",
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

export interface CaptionInput {
  image?: { mimeType: string; data: string }; // base64 inline image
  context?: string;
}

export async function generateCaption(input: CaptionInput): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment to use AI captions."
    );
  }

  const parts: Array<Record<string, unknown>> = [];
  if (input.image) {
    parts.push({
      inlineData: { mimeType: input.image.mimeType, data: input.image.data },
    });
  }
  parts.push({ text: buildPrompt({ hasImage: !!input.image, context: input.context }) });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}
