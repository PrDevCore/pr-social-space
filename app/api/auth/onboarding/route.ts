import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser, type OnboardingStepId } from "@/lib/store";

const STEP_IDS: OnboardingStepId[] = [
  "connect_accounts",
  "set_currency",
  "dashboard_tour",
  "ads_boost",
];

// POST /api/auth/onboarding { lastStep?, completed? }
// Persists the signed-in user's setup-wizard progress so it can be resumed
// across sessions and the dashboard knows when onboarding is done.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lastStep?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    body.lastStep !== undefined &&
    !STEP_IDS.includes(body.lastStep as OnboardingStepId)
  ) {
    return NextResponse.json({ error: "Unknown onboarding step." }, { status: 400 });
  }

  try {
    const updated = await updateUser(user.id, {
      onboarding: {
        ...(body.lastStep !== undefined
          ? { lastStep: body.lastStep as OnboardingStepId }
          : {}),
        ...(body.completed !== undefined ? { completed: body.completed } : {}),
      },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("onboarding:", err);
    return NextResponse.json(
      { error: "Failed to save onboarding progress." },
      { status: 500 }
    );
  }
}
