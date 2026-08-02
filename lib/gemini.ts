import "server-only";

/**
 * Server-only Gemini client for generating post captions.
 * The GEMINI_API_KEY must never reach the browser; the /api/ai/caption route
 * calls through here on behalf of the signed-in user.
 *
 * Images are sent inline as base64. Videos are uploaded to the Gemini Files
 * API (which handles large files) and referenced by URI.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  `${MODEL}:generateContent`;
const UPLOAD_URL = "https://generativelanguage.googleapis.com/upload/v1beta/files";

function buildPrompt(opts: {
  hasImage: boolean;
  hasVideo: boolean;
  context?: string;
}): string {
  const lines = [
    "You are a professional social media manager.",
    `Write ONE engaging, appropriate caption for the attached ${
      opts.hasVideo ? "video" : "media"
    }.`,
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

/** Upload bytes to the Gemini Files API and return the file reference. */
async function uploadVideoFile(opts: {
  mimeType: string;
  data: Buffer;
  filename?: string;
}): Promise<{ uri: string; name: string }> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  const form = new FormData();
  form.append(
    "metadata",
    JSON.stringify({
      file: {
        display_name: opts.filename ?? "video.mp4",
        mime_type: opts.mimeType,
      },
    })
  );
  form.append(
    "file",
    new Blob([new Uint8Array(opts.data)], { type: opts.mimeType }),
    opts.filename ?? "video.mp4"
  );

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini upload error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return { uri: data.file.uri, name: data.file.name };
}

/** Poll the file until Gemini has finished processing it. */
async function waitForFileReady(name: string, timeoutMs = 45000): Promise<boolean> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${name}`,
      { headers: { "x-goog-api-key": API_KEY } }
    );
    const data = await res.json().catch(() => ({}));
    const state = data.file?.state;
    if (state === "PROCESSED") return true;
    if (state === "FAILED") return false;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

export interface CaptionInput {
  image?: { mimeType: string; data: string }; // base64 inline image
  video?: { mimeType: string; data: Buffer }; // raw bytes, uploaded via Files API
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
  if (input.video) {
    const file = await uploadVideoFile({
      mimeType: input.video.mimeType,
      data: input.video.data,
    });
    const ready = await waitForFileReady(file.name);
    if (!ready) throw new Error("Gemini couldn't process the video in time.");
    parts.push({ fileData: { mimeType: input.video.mimeType, fileUri: file.uri } });
  }
  parts.push({
    text: buildPrompt({
      hasImage: !!input.image,
      hasVideo: !!input.video,
      context: input.context,
    }),
  });

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
