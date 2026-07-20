import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveClerkConfig, clearDeprecatedClerkRedirectEnv } from "@/lib/clerk-config";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  clearDeprecatedClerkRedirectEnv();
  const { signInFallbackRedirectUrl, signInForceRedirectUrl } = resolveClerkConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={signInFallbackRedirectUrl}
        forceRedirectUrl={signInForceRedirectUrl}
      />
    </main>
  );
}
