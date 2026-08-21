"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Client wrapper around next-themes so the root layout can stay a server
 * component. Sets `class` as the dark-mode strategy (Tailwind darkMode: class),
 * defaults to the OS preference, and persists the user's choice.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
