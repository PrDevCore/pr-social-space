import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import LinkedInButton from "@/components/LinkedInButton";
import RegisterForm from "./RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Join Social Hub free and manage all your social platforms from one dashboard.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const errorMessage: Record<string, string> = {
    linkedin_not_configured:
      "LinkedIn sign-up isn't enabled yet. Use your email and password instead.",
    linkedin_auth_failed:
      "LinkedIn sign-up didn't complete. Please try again.",
  };
  const error = searchParams.error ? errorMessage[searchParams.error] : undefined;

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
            <h1 className="text-2xl font-semibold tracking-tight">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-black/60">
              Join Social Hub and manage all your social platforms.
            </p>
          </div>

          {error && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <LinkedInButton next={searchParams.next} from="/auth/register" />

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-xs uppercase tracking-wide text-black/40">
              or sign up with email
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <RegisterForm next={searchParams.next} />

          <p className="mt-6 text-center text-sm text-black/60">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
