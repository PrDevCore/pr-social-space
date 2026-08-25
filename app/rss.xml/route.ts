import { getAllPosts, getPostUrl } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** /rss.xml — RSS 2.0 feed of the blog. */
export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${getPostUrl(p.slug)}</link>
      <guid isPermaLink="true">${getPostUrl(p.slug)}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      ${p.keywords.map((k) => `<category>${escapeXml(k)}</category>`).join("\n      ")}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Social Hub Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides on social media scheduling, posting times, AI captions and multi-platform management.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
