"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CONSENT_COOKIE = "social_hub_consent";
const AD_FREQUENCY_COOKIE = "social_hub_ad_last_loaded";
const AD_FREQUENCY_WINDOW_SECONDS = 30 * 60;

type ConsentChoice = "accepted" | "rejected";

function setConsent(value: ConsentChoice) {
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function loadScript(src: string, attributes: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
  document.head.appendChild(script);
}

function canLoadAdvertising() {
  const lastLoaded = Number(
    document.cookie.match(new RegExp(`(?:^|; )${AD_FREQUENCY_COOKIE}=([^;]*)`))?.[1] ?? 0,
  );
  return !lastLoaded || Date.now() - lastLoaded >= AD_FREQUENCY_WINDOW_SECONDS * 1000;
}

function markAdvertisingLoaded() {
  document.cookie = `${AD_FREQUENCY_COOKIE}=${Date.now()}; Path=/; Max-Age=${AD_FREQUENCY_WINDOW_SECONDS}; SameSite=Lax`;
}

function enableAdvertising() {
  if (!window.location.pathname.startsWith("/blog")) return;
  if (!canLoadAdvertising()) return;
  markAdvertisingLoaded();
  loadScript(
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1099086350795267",
    { crossorigin: "anonymous" },
  );
  loadScript("https://acscdn.com/script/aclib.js");
  window.setTimeout(() => {
    if (typeof window.aclib?.runAutoTag === "function") {
      window.aclib.runAutoTag({ zoneId: "6aogt6pums" });
    }
  }, 250);
}

function enableAnalytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-NC7RSW92";
  if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`);
}

export default function PrivacyConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const saved = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`))?.[1] as ConsentChoice | undefined;
    if (saved === "accepted" || saved === "rejected") {
      setChoice(saved);
      if (saved === "accepted") {
        enableAdvertising();
        enableAnalytics();
      }
    }
  }, [pathname]);

  const choose = (next: ConsentChoice) => {
    setConsent(next);
    setChoice(next);
    if (next === "accepted") {
      enableAdvertising();
      enableAnalytics();
    }
  };

  if (choice) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[60] mx-auto w-auto max-w-3xl rounded-2xl border border-black/15 bg-white p-4 text-black shadow-2xl shadow-black/20 dark:border-white/20 dark:bg-[#12243d] dark:text-white sm:inset-x-4 sm:p-5" role="dialog" aria-label="Privacy and advertising preferences">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 max-w-2xl text-sm leading-6 text-black/70 dark:text-white/70">
          Social Hub uses essential cookies to operate the service and optional advertising and analytics cookies to improve the experience and support the platform. Read our <a className="font-medium text-black underline underline-offset-4 dark:text-white" href="/privacy">Privacy Policy</a> and <a className="font-medium text-black underline underline-offset-4 dark:text-white" href="/cookies">Cookie & Advertising Policy</a>.
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => choose("rejected")} className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-black transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10">Reject optional</button>
          <button type="button" onClick={() => choose("accepted")} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Accept optional</button>
        </div>
      </div>
    </aside>
  );
}

declare global {
  interface Window {
    aclib?: { runAutoTag?: (options: { zoneId: string }) => void };
    dataLayer?: Array<Record<string, unknown>>;
  }
}
