import { ImageResponse } from "next/og";
import { getPostBySlug, getAllPosts } from "@/lib/blog";

export const alt = "Social Hub blog guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/**
 * Programmatic OG card (1200x630) per blog post at /blog/<slug>/opengraph-image.
 */
export default async function PostOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "The Social Hub blog";

  // Rough character wrap for the 1200px canvas.
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 34) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
    if (lines.length >= 3) break;
  }
  if (current.trim() && lines.length < 4) lines.push(current.trim());

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
            "linear-gradient(135deg, #d4a373 0%, #b07f4f 55%, #6b4423 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: 18,
              background: "#3b2314",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            SH
          </div>
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#ffffff",
              marginLeft: 24,
            }}
          >
            Social Hub · Blog
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: lines.length > 2 ? 52 : 62,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>

        <div style={{ fontSize: 26, color: "#f5e8da" }}>
          prsocialhub.space · One dashboard. Every social account.
        </div>
      </div>
    ),
    size
  );
}
