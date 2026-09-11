import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import PlanCard from "@/components/PlanCard";
import PasswordForm from "@/components/PasswordForm";
import PaymentHistory from "@/components/PaymentHistory";
import BackNav from "@/components/BackNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      <BackNav />

      <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-accent/[0.06] p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 size-48 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-white shadow-lg shadow-accent/20 sm:size-24 sm:text-3xl">
              {initials}
            </span>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Account workspace</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{user.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-6 border-t border-foreground/10 pt-4 text-sm sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div><p className="font-semibold">{joined}</p><p className="text-muted-foreground">Member since</p></div>
            <div><p className="font-semibold text-accent">Active</p><p className="text-muted-foreground">Workspace status</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Social Hub" width={32} height={32} className="rounded-lg" />
            <div><p className="text-sm font-semibold">Social Hub</p><p className="text-xs text-muted-foreground">Personal workspace</p></div>
          </div>
          <div className="rounded-2xl bg-accent/[0.08] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Profile health</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Keep your account details current to make publishing and billing smoother.</p>
          </div>
          <p className="text-xs text-muted-foreground">Secure sessions and Argon2id password hashing protect your account.</p>
        </aside>

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Edit details
            </h2>
            <ProfileForm
              name={user.name}
              email={user.email}
              hasPassword={user.hasPassword}
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Sign-in &amp; security
            </h2>
            <PasswordForm hasPassword={user.hasPassword} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50">
              Billing
            </h2>
            <PlanCard />
            <div className="mt-4">
              <PaymentHistory />
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50">
              Account
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">User ID</dt>
                <dd className="truncate font-mono text-xs">{user.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Password</dt>
                <dd>
                  {user.hasPassword ? (
                    <span className="text-green-600">Set</span>
                  ) : (
                    <span className="text-amber-600">Not set (LinkedIn sign-in)</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Joined</dt>
                <dd>{joined}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/[0.03] px-4 py-3 text-xs text-black/50">
              <Image
                src="/logo.png"
                alt="Social Hub"
                width={20}
                height={20}
                className="rounded"
              />
              Secured with Argon2id password hashing and encrypted sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
