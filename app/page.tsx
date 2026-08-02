import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

// [ Your Frontend Login ]
// If the user already has a session, skip straight to /dashboard.
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Image
        src="/logo.png"
        alt="Social Hub logo"
        width={128}
        height={128}
        priority
        className="mb-6"
      />
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        One dashboard. Every social account. One click to post.
      </h1>
      <p className="mt-4 max-w-xl text-black/60">
        Sign in, connect TikTok, Instagram, X, LinkedIn and more via Zernio,
        then publish everywhere from a single composer.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/auth/login" className="btn-primary">
          Sign in
        </Link>
        <Link href="/auth/register" className="btn-secondary">
          Create account
        </Link>
      </div>
    </main>
  );
}
