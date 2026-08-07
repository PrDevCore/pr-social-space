import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Social Hub and manage your social accounts.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-8 text-center">
            <Image
              src="/logo.png"
              alt="Social Hub logo"
              width={96}
              height={96}
              priority
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-black/60">
              Sign in to Social Hub and manage your accounts.
            </p>
          </div>

          <LoginForm next={searchParams.next} />

          <p className="mt-6 text-center text-sm text-black/60">
            No account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-accent hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
