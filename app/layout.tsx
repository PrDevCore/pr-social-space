import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import SWCleanup from "@/components/SWCleanup";
import ThemeProvider from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { detectCurrency } from "@/lib/flutterwave";
import { SITE_URL, absoluteUrl } from "@/lib/site";
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
  creator: "Social Hub",
  publisher: "Social Hub",
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
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Social Hub — one dashboard for every social account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Hub — One dashboard for every social account",
    description:
      "Compose, schedule, engage and report across every major social network from one dashboard.",
    images: [absoluteUrl("/opengraph-image")],
    ...(process.env.NEXT_PUBLIC_TWITTER_SITE
      ? { site: process.env.NEXT_PUBLIC_TWITTER_SITE }
      : {}),
    ...(process.env.NEXT_PUBLIC_TWITTER_CREATOR
      ? { creator: process.env.NEXT_PUBLIC_TWITTER_CREATOR }
      : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Social Hub",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
    ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION
      ? { other: { "yandex-verification": process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION } }
      : {}),
    ...(process.env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION
      ? { other: { "p:domain_verify": process.env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION } }
      : {}),
  },
  other: {
    ...(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      ? { "fb:app_id": process.env.NEXT_PUBLIC_FACEBOOK_APP_ID }
      : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
  colorScheme: "light dark",
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-NC7RSW92";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultCurrency = detectCurrency({ headers: headers() });
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        {/* Google Tag Manager (noscript) — immediately after opening <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <ThemeProvider>
          <CurrencyProvider defaultCurrency={defaultCurrency}>
            {children}
            <SWCleanup />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
