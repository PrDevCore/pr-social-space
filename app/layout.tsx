import type { Metadata } from "next";
import SWCleanup from "@/components/SWCleanup";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Hub",
  description: "Manage every social account and post from one dashboard.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <SWCleanup />
      </body>
    </html>
  );
}
