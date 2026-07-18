"use client";

import { useState } from "react";
import type { SocialPlatform } from "@/lib/postforme";
import { PlatformBadge, PLATFORMS } from "./PlatformIcon";

// (If social posting needed) -> [ Call Post for Me Auth URL Endpoint ]
// This hits our own /api/social/auth-url route (never Post for Me
// directly from the browser), then redirects the user's browser to the
// URL it returns so they can grant OAuth access on the platform's site.
export default function ConnectAccountButton({
  platform,
}: {
  platform: SocialPlatform;
}) {
  const [loading, setLoading] = useState(false);
  const meta = PLATFORMS.find((p) => p.id === platform);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/social/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Couldn't start the connection flow. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
    >
      <PlatformBadge platform={platform} />
      {loading ? "Connecting…" : `Connect ${meta?.label ?? platform}`}
    </button>
  );
}
