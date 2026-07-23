import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Social Hub
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-black/50">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <a
              href="/auth/logout"
              className="text-sm font-medium text-black/50 hover:text-black"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
