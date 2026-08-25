import { SITE_URL, absoluteUrl } from "@/lib/site";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | {
      type: "cta";
      text: string;
      label: string;
      href: string;
    };

export interface BlogPost {
  /** URL slug, e.g. "best-times-to-post-on-social-media" */
  slug: string;
  title: string;
  /** Meta description used for <meta name="description">, OG cards and listings. */
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  keywords: string[];
  /** Reading time in minutes. */
  readingMinutes: number;
  /** Body content, rendered top to bottom. */
  blocks: ContentBlock[];
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getPostUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

/** JSON-LD for an article page. */
export function postJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: getPostUrl(post.slug),
    mainEntityOfPage: getPostUrl(post.slug),
    keywords: post.keywords.join(", "),
    publisher: {
      "@type": "Organization",
      name: "Social Hub",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    author: { "@type": "Organization", name: "Social Hub", url: SITE_URL },
  };
}

/** BreadcrumbList JSON-LD shared by blog pages. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// ---------------------------------------------------------------------------
// Post registry — add new posts here. Sorted newest first by getAllPosts().
// ---------------------------------------------------------------------------
import { bestTimesToPost } from "@/content/blog/best-times-to-post-social-media";
import { socialHubVsCompetitors } from "@/content/blog/social-hub-vs-buffer-hootsuite-later";
import { manageMultipleAccounts } from "@/content/blog/manage-multiple-social-accounts-one-dashboard";
import { scheduleTikTokPosts } from "@/content/blog/how-to-schedule-tiktok-posts-free";
import { aiCaptionsGuide } from "@/content/blog/write-instagram-captions-with-ai";

const POSTS: BlogPost[] = [
  bestTimesToPost,
  socialHubVsCompetitors,
  manageMultipleAccounts,
  scheduleTikTokPosts,
  aiCaptionsGuide,
];
