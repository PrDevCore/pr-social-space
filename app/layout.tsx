import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { resolveClerkConfig } from "@/lib/clerk-config";
import "./globals.css";

const { publishableKey, clerkJsUrl } = resolveClerkConfig();

export const metadata: Metadata = {
  title: "Social Hub",
  description: "Manage every social account and post from one dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} clerkJSUrl={clerkJsUrl}>
      {content}
    </ClerkProvider>
  );
}
