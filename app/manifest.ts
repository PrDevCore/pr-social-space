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
    icons: [{ src: "/logo.png", sizes: "173x115", type: "image/png" }],
  };
}
