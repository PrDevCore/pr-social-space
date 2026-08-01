"use client";

import { useState } from "react";
import type { SocialAccount } from "@/lib/zernio";
import { PlatformBadge } from "./PlatformIcon";

function fileName(url: string) {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

export default function ComposePost({ accounts }: { accounts: SocialAccount[] }) {
  const [caption, setCaption] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim() || selected.length === 0) return;

    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          socialAccountIds: selected,
          mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(`Post ${data.id} is ${data.status}.`);
      setCaption("");
      setMediaUrls([]);
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
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="What do you want to say?"
          className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-accent"
        />
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
        <label className="mb-2 block text-sm font-medium">Post to</label>
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

      <button
        type="submit"
        disabled={submitting || uploading || !caption.trim() || selected.length === 0}
        className="btn-primary w-full sm:w-auto"
      >
        {submitting ? "Publishing…" : "Publish now"}
      </button>

      {result && <p className="text-sm text-black/70">{result}</p>}
    </form>
  );
}
