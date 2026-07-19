import { SignIn } from "@clerk/nextjs";
import { resolveClerkConfig } from "@/lib/clerk-config";

export default function SignInPage() {
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
