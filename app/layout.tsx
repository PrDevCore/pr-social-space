import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

  if (!clerkPublishableKey) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-8 text-center">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <h1 className="mb-4 text-3xl font-semibold">Clerk configuration is missing</h1>
              <p className="mb-6 text-sm text-slate-600">
                Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in your environment 
                so the app can run and build successfully.
              </p>
              <p className="text-sm text-slate-500">
                See <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">README.md</code> for setup instructions.
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  );
}
