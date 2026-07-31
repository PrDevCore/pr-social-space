"use client";

import { useEffect } from "react";

// Cleans up the service worker + caches left behind by the app's earlier PWA
// iteration (which precached /site.webmanifest, genfavicon-*.png, etc. on the
// old deployed origin). The current app is a plain web app and never registers
// a service worker, so removing any stragglers is always safe.
export default function SWCleanup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((r) => r.unregister()))
        )
        .catch(() => {});
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
  }, []);

  return null;
}
