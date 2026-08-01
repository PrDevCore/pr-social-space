"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setMessage({ kind: "err", text: "Name can't be empty." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile.");
      setMessage({ kind: "ok", text: "Profile updated." });
      router.refresh();
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || !displayName.trim()}
        className="btn-primary w-full sm:w-auto"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
