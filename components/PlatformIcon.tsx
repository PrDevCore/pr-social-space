import type { SocialPlatform } from "@/lib/postforme";

export const PLATFORMS: { id: SocialPlatform; label: string; color: string }[] = [
  { id: "x", label: "X", color: "#000000" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", color: "#000000" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "pinterest", label: "Pinterest", color: "#E60023" },
  { id: "threads", label: "Threads", color: "#000000" },
  { id: "bluesky", label: "Bluesky", color: "#1185FE" },
];

export function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  const meta = PLATFORMS.find((p) => p.id === platform);
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: meta?.color ?? "#333" }}
      title={meta?.label ?? platform}
    >
      {(meta?.label ?? platform).slice(0, 1)}
    </span>
  );
}
