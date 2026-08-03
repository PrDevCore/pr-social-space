"use client";

import { useState } from "react";
import type { SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";
import AIAssistant from "./AIAssistant";
import PostPreview from "./PostPreview";

function fileName(url: string) {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

/** Pull #hashtags out of a caption for the dedicated post field. */
function extractHashtags(caption: string): string[] {
  const tags = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return Array.from(new Set(tags.map((t) => t.replace(/^#/, ""))));
}

export default function ComposePost({ accounts }: { accounts: SocialAccount[] }) {
  const [caption, setCaption] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduleAt, setScheduleAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedAccounts = accounts.filter((a) => selected.includes(a.id));

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function addUrl() {
    const url = mediaUrlInput.trim();
    if (!url) return;
    setMediaUrls((prev) => [...prev, url]);
    setMediaUrlInput("");
  }

  function removeMedia(i: number) {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;

    setUploading(true);
    setResult(null);
    try {
      for (const file of files) {
        // 1. Ask the server for a presigned upload URL (API key stays server-side).
        const res = await fetch("/api/social/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Upload failed.");
        }
        const { uploadUrl, publicUrl } = await res.json();

        // 2. PUT the bytes straight to Zernio's storage (CORS-enabled).
        const up = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!up.ok) throw new Error("Upload failed.");

        setMediaUrls((prev) => [...prev, publicUrl]);
      }
    } catch (err) {
      console.error(err);
      setResult(
        err instanceof Error && err.message !== "Upload failed."
          ? err.message
          : "Upload failed. Try a different file."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateCaption() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: mediaUrls[0],
          context: caption.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate a caption.");
      setCaption(data.caption);
    } catch (err) {
      console.error(err);
      setAiError(
        err instanceof Error ? err.message : "Couldn't generate a caption."
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim() || selected.length === 0) return;

    setSubmitting(true);
    setResult(null);
    const hashtags = extractHashtags(caption);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          socialAccountIds: selected,
          mediaUrls: mediaUrls.length ? mediaUrls : undefined,
          scheduledAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
          hashtags: hashtags.length ? hashtags : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const action = scheduleAt ? "scheduled" : "published";
      setResult(`Post ${data.id} is ${data.status} (${action}).`);
      setCaption("");
      setMediaUrls([]);
      setScheduleAt("");
      setSelected([]);
    } catch (err) {
      console.error(err);
      setResult("Something went wrong publishing that post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="card text-sm text-black/60">
        Connect at least one account above before composing a post.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Caption</label>
          <button
            type="button"
            onClick={handleGenerateCaption}
            disabled={aiLoading || mediaUrls.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
            title="Write a caption for your media with Gemini AI"
          >
            {aiLoading ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            {aiLoading ? "Generating…" : "Generate with AI"}
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="What do you want to say?"
          className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-accent"
        />
        <div className="mt-2">
          <AIAssistant
            caption={caption}
            setCaption={setCaption}
            platform={selectedAccounts[0]?.platform ?? "instagram"}
          />
        </div>
        {aiError && <p className="mt-1 text-xs text-red-600">{aiError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Media</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={uploading}
            onChange={handleFiles}
            className="hidden"
          />
          <label
            htmlFor="media-upload"
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 ${
              uploading ? "pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4"
                />
              </svg>
            )}
            {uploading ? "Uploading…" : "Upload media"}
          </label>
          <div className="flex flex-1 gap-2">
            <input
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              placeholder="https://… (or upload a file)"
              className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!mediaUrlInput.trim()}
              className="rounded-xl border border-black/10 px-3 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {mediaUrls.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {mediaUrls.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-accent hover:underline"
                >
                  {fileName(url)}
                </a>
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="shrink-0 font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Post to</label>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                selected.includes(a.id)
                  ? "border-accent bg-accent/10"
                  : "border-black/10 bg-white hover:bg-black/5"
              }`}
            >
              <PlatformBadge platform={a.platform} />
              {a.username ?? a.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium">Schedule</span>
          <input
            type="datetime-local"
            value={scheduleAt}
            min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || uploading || !caption.trim() || selected.length === 0}
            className="btn-primary"
          >
            {submitting ? "Sending…" : scheduleAt ? "Schedule post" : "Publish now"}
          </button>
        </div>
      </div>

      {scheduleAt && (
        <p className="text-xs text-black/50">
          Will publish{" "}
          {new Date(scheduleAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          instead of immediately.
        </p>
      )}

      {result && <p className="text-sm text-black/70">{result}</p>}
      </form>

      <PostPreview
        caption={caption}
        mediaUrls={mediaUrls}
        accounts={selectedAccounts}
        scheduleAt={scheduleAt}
      />
    </div>
  );
}
