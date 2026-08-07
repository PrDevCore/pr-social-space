import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";

export const alt = "Social Hub — One dashboard for every social account";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

/**
 * Programmatic Open Graph / Twitter card image (1200x630) served at
 * /opengraph-image. Drives link previews on X, LinkedIn, WhatsApp, Slack.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 84px",
          background:
            "linear-gradient(135deg, #3F5BFF 0%, #2A3FC9 55%, #1E2B7A 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${SITE_URL}/logo.png`}
            alt=""
            width={92}
            height={92}
            style={{ borderRadius: 20 }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 28,
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 700, color: "#ffffff" }}>
              Social Hub
            </span>
            <span style={{ fontSize: 26, color: "#cdd6ff" }}>
              prsocialhub.space
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
          }}
        >
          <span>One dashboard.</span>
          <span>Every social account.</span>
          <span style={{ color: "#b8c4ff" }}>One click to post.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: 26,
              color: "#e6eaff",
              letterSpacing: 0.4,
            }}
          >
            TikTok · Instagram · X · LinkedIn · YouTube · Pinterest
          </span>
        </div>
      </div>
    ),
    size
  );
}
