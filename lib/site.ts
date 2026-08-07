/**
 * Canonical public site URL used for SEO metadata (metadataBase, canonical,
 * sitemap, JSON-LD). Decoupled from APP_URL, which drives OAuth/billing
 * redirects and may point at a deployment/preview domain in some envs.
 */
export const SITE_URL = process.env.SITE_URL ?? "https://prsocialhub.space";

/** Normalize to a trailing-slash-free origin for building absolute URLs. */
export function absoluteUrl(path = "/"): string {
  const base = SITE_URL.replace(/\/+$/, "");
  if (path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
