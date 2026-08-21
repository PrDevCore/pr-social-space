"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  name: initialName,
  email: initialEmail,
  hasPassword,
}: {
  name: string;
  email: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const nameChanged = displayName.trim() !== initialName;
  const emailChanged = email.trim().toLowerCase() !== initialEmail.toLowerCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setMessage({ kind: "err", text: "Name can't be empty." });
      return;
    }
    if (emailChanged && !hasPassword && !currentPassword) {
      setMessage({
        kind: "err",
        text: "Set a password first (below), then you can change your email.",
      });
      return;
    }
    if (emailChanged && hasPassword && !currentPassword) {
      setMessage({ kind: "err", text: "Enter your current password to change your email." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          ...(emailChanged ? { email: email.trim() } : {}),
          ...(emailChanged && currentPassword ? { currentPassword } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile.");
      setMessage({ kind: "ok", text: "Profile updated." });
      setCurrentPassword("");
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

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-accent"
        />
        {emailChanged && !hasPassword && (
          <p className="mt-1.5 text-xs text-amber-600">
            Set a password first to change your email.
          </p>
        )}
      </div>

      {emailChanged && hasPassword && (
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-black/50">
            Required to confirm the email change.
          </p>
        </div>
      )}

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