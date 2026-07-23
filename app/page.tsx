import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/60">
        Social Hub
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        One dashboard. Every social account. One click to post.
      </h1>
      <p className="mt-4 max-w-xl text-black/60">
        Sign in, connect TikTok, Instagram, X, LinkedIn and more via Post for
        Me, then publish everywhere from a single composer.
      </p>
      <div className="mt-8 flex gap-3">
        <a href="/auth/login" className="btn-primary">
          Sign in
        </a>
        <a href="/auth/login?screen_hint=signup" className="btn-secondary">
          Create account
        </a>
      </div>
    </main>
  );
}
