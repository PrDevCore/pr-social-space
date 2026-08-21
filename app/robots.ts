import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
