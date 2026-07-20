import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveClerkConfig, clearDeprecatedClerkRedirectEnv } from "@/lib/clerk-config";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  clearDeprecatedClerkRedirectEnv();
  const { signUpFallbackRedirectUrl, signUpForceRedirectUrl } = resolveClerkConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl={signUpFallbackRedirectUrl}
        forceRedirectUrl={signUpForceRedirectUrl}
      />
    </main>
  );
}
