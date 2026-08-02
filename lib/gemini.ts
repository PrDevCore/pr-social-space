import "server-only";

/**
 * Server-only Gemini client for generating post captions.
 * The GEMINI_API_KEY must never reach the browser; the /api/ai/caption route
 * calls through here on behalf of the signed-in user.
 *
 * Images and small videos are sent inline as base64 (fast, no server-side
 * processing wait). Larger videos are uploaded to the Gemini Files API —
 * which transcodes them at ~1fps — and referenced by URI. That File API path
 * can take a while, so the Files-API fallback polls for up to FILE_READY_TIMEOUT.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  `${MODEL}:generateContent`;
const UPLOAD_URL = "https://generativelanguage.googleapis.com/upload/v1beta/files";

// Keep the total inline request payload comfortably under Gemini's 20MB
// recommendation: 15MB of raw bytes base64-encodes to ~20MB.
const MAX_INLINE_VIDEO_BYTES = 15 * 1024 * 1024;
const FILE_READY_TIMEOUT_MS = 120_000;

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
  if (!data.file?.uri || !data.file?.name) {
    throw new Error("Gemini upload didn't return a file reference.");
  }
  return { uri: data.file.uri, name: data.file.name };
}

/**
 * Poll the file until Gemini finishes processing it. Distinguishes a genuine
 * processing failure (FAILED) from simply not being ready yet (timeout).
 * Throws on failure so callers get an accurate message.
 */
async function waitForFileReady(name: string, timeoutMs = FILE_READY_TIMEOUT_MS): Promise<void> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${name}`,
      { headers: { "x-goog-api-key": API_KEY } }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini file status error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json().catch(() => ({}));
    const state = data.file?.state;
    if (state === "PROCESSED") return;
    if (state === "FAILED") {
      throw new Error(
        "Gemini couldn't process this video (unsupported codec or corrupted file). Try a standard H.264 MP4."
      );
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(
    "Gemini is still processing this video. Try a shorter or smaller video (under 15 MB) for faster results."
  );
}

export interface CaptionInput {
  image?: { mimeType: string; data: string }; // base64 inline image
  video?: { mimeType: string; data: Buffer }; // raw bytes
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
    if (input.video.data.length <= MAX_INLINE_VIDEO_BYTES) {
      // Small video: send inline as base64 — no Files API wait required.
      parts.push({
        inlineData: {
          mimeType: input.video.mimeType,
          data: input.video.data.toString("base64"),
        },
      });
    } else {
      const file = await uploadVideoFile({
        mimeType: input.video.mimeType,
        data: input.video.data,
      });
      await waitForFileReady(file.name);
      parts.push({
        fileData: { mimeType: input.video.mimeType, fileUri: file.uri },
      });
    }
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
