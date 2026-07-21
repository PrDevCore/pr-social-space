const DEFAULT_TEST_PUBLISHABLE_KEY = "pk_test_YmFsYW5jZWQtbW9sZS05MS5jbGVyay5hY2NvdW50cy5kZXYk";
const FALLBACK_CLERK_JS_URL = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
const DEFAULT_DASHBOARD_PATH = "/dashboard";

function normalize(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPublishableKey(value: string) {
  return /^pk_(test|live)_[A-Za-z0-9._~-]+$/.test(value);
}

function isLikelyClerkScriptUrl(value: string) {
  return /^https:\/\/[^\s]+\/npm\/@clerk\/clerk-js@[^\s]+\/dist\/clerk(?:\.[^\s]+)?browser\.js$/i.test(value);
}

function resolveRedirectUrl(env: Record<string, string | undefined>, preferredVar: string, fallback = DEFAULT_DASHBOARD_PATH) {
  const preferred = normalize(env[preferredVar]);

  if (preferred) {
    return preferred.startsWith("http") ? preferred : preferred;
  }

  const appUrl = normalize(env.APP_URL);
  const vercelUrl = normalize(env.VERCEL_URL);
  const baseUrl = appUrl || (vercelUrl ? `https://${vercelUrl}` : "");

  if (!baseUrl) {
    return fallback;
  }

  try {
    return new URL(fallback, baseUrl).toString();
  } catch {
    return fallback;
  }
}

export function clearDeprecatedClerkRedirectEnv() {
  delete process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL;
  delete process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL;
  delete process.env.NEXT_PUBLIC_CLERK_REDIRECT_URL;
}

export function resolveClerkConfig(env = process.env) {
  const publishableKey = normalize(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const explicitClerkJsUrl = normalize(env.NEXT_PUBLIC_CLERK_JS_URL);

  const resolvedPublishableKey = isValidPublishableKey(publishableKey)
    ? publishableKey
    : DEFAULT_TEST_PUBLISHABLE_KEY;

  // Only use an explicit Clerk JS URL when provided and looking like a Clerk script URL.
  // Avoid forcing the fallback CDN script in development environments (for example
  // when running behind a proxy like GitHub.dev) to prevent forwarded Server Actions
  // requests that fail origin checks.
  const resolvedClerkJsUrl = isLikelyClerkScriptUrl(explicitClerkJsUrl)
    ? explicitClerkJsUrl
    : undefined;

  const dashboardPath = normalize(env.NEXT_PUBLIC_APP_DASHBOARD_PATH) || DEFAULT_DASHBOARD_PATH;
  const dashboardRedirect = dashboardPath.startsWith("http")
    ? dashboardPath
    : resolveRedirectUrl(env, "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", dashboardPath);

  return {
    publishableKey: resolvedPublishableKey,
    clerkJsUrl: resolvedClerkJsUrl,
    signInFallbackRedirectUrl: dashboardRedirect,
    signInForceRedirectUrl: dashboardRedirect,
    signUpFallbackRedirectUrl: dashboardRedirect,
    signUpForceRedirectUrl: dashboardRedirect,
  };
}
