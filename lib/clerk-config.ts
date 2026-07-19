const DEFAULT_TEST_PUBLISHABLE_KEY = "pk_test_YmFsYW5jZWQtbW9sZS05MS5jbGVyay5hY2NvdW50cy5kZXYk";
const FALLBACK_CLERK_JS_URL = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";

function normalize(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPublishableKey(value: string) {
  return /^pk_(test|live)_[A-Za-z0-9._~-]+$/.test(value);
}

function isLikelyClerkScriptUrl(value: string) {
  return /^https:\/\/[^\s]+\/npm\/@clerk\/clerk-js@[^\s]+\/dist\/clerk(?:\.[^\s]+)?browser\.js$/i.test(value);
}

function resolveRedirectUrl(env: Record<string, string | undefined>, preferredVar: string, legacyVar: string, fallback = "/dashboard") {
  const preferred = normalize(env[preferredVar]);
  const legacy = normalize(env[legacyVar]);

  return preferred || legacy || fallback;
}

export function resolveClerkConfig(env = process.env) {
  const publishableKey = normalize(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const explicitClerkJsUrl = normalize(env.NEXT_PUBLIC_CLERK_JS_URL);

  const resolvedPublishableKey = isValidPublishableKey(publishableKey)
    ? publishableKey
    : DEFAULT_TEST_PUBLISHABLE_KEY;

  const resolvedClerkJsUrl = isLikelyClerkScriptUrl(explicitClerkJsUrl)
    ? explicitClerkJsUrl
    : FALLBACK_CLERK_JS_URL;

  return {
    publishableKey: resolvedPublishableKey,
    clerkJsUrl: resolvedClerkJsUrl,
    signInFallbackRedirectUrl: resolveRedirectUrl(
      env,
      "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL"
    ),
    signInForceRedirectUrl: resolveRedirectUrl(
      env,
      "NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL"
    ),
    signUpFallbackRedirectUrl: resolveRedirectUrl(
      env,
      "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL"
    ),
    signUpForceRedirectUrl: resolveRedirectUrl(
      env,
      "NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL"
    ),
  };
}
