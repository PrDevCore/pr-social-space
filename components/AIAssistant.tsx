"use client";

import { useState } from "react";

type ToneId = "casual" | "professional" | "playful";

/**
 * AI writing assistant, embedded in the composer's caption area.
 * - Hashtags: generates a chip list; clicking a chip appends it to the caption.
 * - Tone: rewrites the current caption for the active platform.
 * Uses the existing /api/ai/write route (server-side Gemini, key never
 * reaches the browser).
 */
export default function AIAssistant({
  caption,
  setCaption,
  platform,
}: {
  caption: string;
  setCaption: (value: string) => void;
  platform: string;
}) {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hsLoading, setHsLoading] = useState(false);
  const [hsError, setHsError] = useState<string | null>(null);
  const [tone, setTone] = useState<ToneId>("casual");
  const [toneLoading, setToneLoading] = useState(false);
  const [toneError, setToneError] = useState<string | null>(null);

  async function generateHashtags() {
    if (!caption.trim()) {
      setHsError("Write a caption first, then generate hashtags.");
      return;
    }
    setHsLoading(true);
    setHsError(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hashtags", content: caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to generate hashtags");
      setHashtags(data.hashtags ?? []);
      if (!data.hashtags?.length) setHsError("Gemini returned no hashtags.");
    } catch (err) {
      setHsError(err instanceof Error ? err.message : "Failed to generate hashtags");
    } finally {
      setHsLoading(false);
    }
  }

  function insert(tag: string) {
    const next = `${caption.trim()} #${tag}`.trim();
    setCaption(next);
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }

  async function applyTone() {
    if (!caption.trim()) {
      setToneError("Write a caption first, then adjust the tone.");
      return;
    }
    setToneLoading(true);
    setToneError(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tone", text: caption, platform, tone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to adjust tone");
      setCaption(data.text);
    } catch (err) {
      setToneError(err instanceof Error ? err.message : "Failed to adjust tone");
    } finally {
      setToneLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generateHashtags}
          disabled={hsLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
          title="Generate relevant hashtags for the current caption"
        >
          {hsLoading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )}
          Hashtags
        </button>

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-black/50">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ToneId)}
            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-accent"
          >
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="playful">Playful</option>
          </select>
          <button
            type="button"
            onClick={applyTone}
            disabled={toneLoading}
            className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {toneLoading ? "Rewriting…" : "Apply"}
          </button>
        </div>
      </div>

      {(hsError || toneError) && (
        <p className="text-xs text-red-600">{hsError ?? toneError}</p>
      )}

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => insert(tag)}
              className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/15"
              title="Click to insert into caption"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
