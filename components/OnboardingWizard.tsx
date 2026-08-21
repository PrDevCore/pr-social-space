"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/store";
import type { OnboardingStepId } from "@/lib/store";

interface StepDef {
  id: OnboardingStepId;
  title: string;
  description: string;
  cta: string;
  bullets?: string[];
  icon: React.ReactNode;
}

const iconClass = "h-5 w-5";

const STEPS: StepDef[] = [
  {
    id: "connect_accounts",
    title: "Connect Your Accounts",
    description:
      "Link your first social platform to start publishing, scheduling, and engaging.",
    cta: "Got it",
    bullets: [
      "Use the Connect Account button in the left sidebar",
      "You can add more platforms anytime from Accounts",
    ],
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m7.828-2.828a4 4 0 015.656 0l-3 3a4 4 0 01-5.656 0" />
      </svg>
    ),
  },
  {
    id: "set_currency",
    title: "Set Your Currency",
    description:
      "Pick your billing currency (USD, NGN, or GBP) so plan pricing and boosts are shown in your local currency.",
    cta: "Got it",
    bullets: ["Switch anytime with the region toggle in the top bar"],
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm-9-9h18m-9 9c2.5-2 4-4.5 4-9s-1.5-7-4-9c-2.5 2-4 4.5-4 9s1.5 7 4 9z" />
      </svg>
    ),
  },
  {
    id: "dashboard_tour",
    title: "Dashboard Tour",
    description: "Four areas cover everything you'll do day to day:",
    cta: "Got it",
    bullets: [
      "Composer — write once, publish or schedule everywhere",
      "Calendar & Scheduler — plan your content week at a glance",
      "Inbox — replies and mentions across platforms in one place",
      "Analytics — track performance and export PDF reports",
    ],
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: "ads_boost",
    title: "Boost Posts as Ads",
    description:
      "Turn any published post into a paid campaign without losing its engagement.",
    cta: "Finish setup",
    bullets: [
      'Hit "Boost a post" on the Campaigns tab to create your first ad',
      "Pause, resume, and track campaigns from the same panel",
    ],
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export default function OnboardingWizard({
  user,
  onComplete,
}: {
  user: PublicUser;
  /** Optional callback fired after the wizard is dismissed. */
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const startIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === user.onboarding.lastStep)
  );
  const [stepIndex, setStepIndex] = useState(startIndex);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function finish() {
    setDismissed(true);
    onComplete?.();
    router.refresh();
  }

  async function persist(payload: {
    lastStep?: OnboardingStepId;
    completed?: boolean;
  }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save progress.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save progress.");
    } finally {
      setBusy(false);
    }
  }

  async function handleNext() {
    if (isLast) {
      await persist({ completed: true });
      finish();
      return;
    }
    const next = STEPS[stepIndex + 1];
    await persist({ lastStep: next.id });
    setStepIndex(stepIndex + 1);
  }

  async function handleSkip() {
    await persist({ completed: true });
    finish();
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Setup wizard"
    >
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Welcome, {user.name.split(" ")[0]}!
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Let&apos;s get you set up in four quick steps.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            aria-label="Close setup wizard"
            className="rounded-lg p-1 text-black/40 hover:bg-black/5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                i <= stepIndex ? "bg-accent" : "bg-black/10"
              }`}
            />
          ))}
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            {step.icon}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h3 className="font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-black/60">{step.description}</p>
            {step.bullets && (
              <ul className="mt-3 space-y-1.5">
                {step.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-black/70">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-gradient-to-br from-accent to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Saving…" : step.cta}
        </button>

        {!isLast && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            className="mt-3 w-full rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
