import type { Metadata } from "next";
import SWCleanup from "@/components/SWCleanup";
import ThemeProvider from "@/components/ThemeProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Social Hub — One dashboard for every social account",
    template: "%s | Social Hub",
  },
  description:
    "Compose, schedule, engage and report across TikTok, Instagram, X, LinkedIn, YouTube and more — from one dashboard. AI captions, unified inbox, analytics and PDF reports.",
  keywords: [
    "social media manager",
    "social media dashboard",
    "schedule posts",
    "multi-platform posting",
    "TikTok scheduling",
    "Instagram scheduler",
    "LinkedIn scheduler",
    "social media analytics",
    "AI captions",
    "social media tool",
  ],
  applicationName: "Social Hub",
  category: "social media management",
  authors: [{ name: "Social Hub" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Social Hub",
    title: "Social Hub — One dashboard for every social account",
    description:
      "Compose, schedule, engage and report across every major social network from one dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Hub — One dashboard for every social account",
    description:
      "Compose, schedule, engage and report across every major social network from one dashboard.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          {children}
          <SWCleanup />
        </ThemeProvider>
      </body>
    </html>
  );
}
