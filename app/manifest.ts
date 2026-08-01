import type { MetadataRoute } from "next";

// Web App Manifest — served at /manifest.webmanifest. Keeps the app's icon
// metadata up to date now that the earlier PWA iteration is gone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Social Hub",
    short_name: "Social Hub",
    description: "Manage every social account and post from one dashboard.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3F5BFF",
    icons: [
      { src: "/genfavicon-16.png", sizes: "16x16", type: "image/png" },
      { src: "/genfavicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/genfavicon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/genfavicon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/genfavicon-256.png", sizes: "256x256", type: "image/png" },
      { src: "/genfavicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
