import type { MetadataRoute } from "next";

// /robots.txt — allow public pages, keep auth-protected areas and APIs out
// of the crawl budget.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/content", "/profile", "/api"],
      },
    ],
    sitemap: "https://prsocialhub.space/sitemap.xml",
  };
}
