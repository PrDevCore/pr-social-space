"use client";

import { useState } from "react";
import type { SocialAccount } from "@/lib/postforme";
import { PlatformBadge } from "./PlatformIcon";

export default function ComposePost({ accounts }: { accounts: SocialAccount[] }) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
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
          mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(`Post ${data.id} is ${data.status}.`);
      setCaption("");
      setMediaUrl("");
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
        <label className="mb-1 block text-sm font-medium">Media URL (optional)</label>
        <input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-accent"
        />
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
        disabled={submitting || !caption.trim() || selected.length === 0}
        className="btn-primary w-full sm:w-auto"
      >
        {submitting ? "Publishing…" : "Publish now"}
      </button>

      {result && <p className="text-sm text-black/70">{result}</p>}
    </form>
  );
}
