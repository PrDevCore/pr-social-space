import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureProfileForUser, listAccounts, SocialAccount } from "@/lib/zernio";
import ContentGallery from "@/components/ContentGallery";

// /content — full-size media library. middleware.ts guarantees a session
// exists here, but we re-validate for type-safety / defense in depth.
export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  let accounts: SocialAccount[] = [];
  let loadError: string | null = null;
  try {
    const profileId = await ensureProfileForUser(user.id);
    accounts = await listAccounts(profileId);
  } catch (err) {
    console.error(err);
    loadError = "Couldn't reach Zernio. Check ZERNIO_API_KEY in your environment.";
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}
      <ContentGallery accounts={accounts} />
    </div>
  );
}
