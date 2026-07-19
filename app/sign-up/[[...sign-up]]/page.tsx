import { SignUp } from "@clerk/nextjs";
import { resolveClerkConfig } from "@/lib/clerk-config";

export default function SignUpPage() {
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
