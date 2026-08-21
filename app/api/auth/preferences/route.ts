import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseCurrency, type BillingCurrency } from "@/lib/flutterwave";
import { updateUser } from "@/lib/store";

// PATCH /api/auth/preferences { currency: "USD" | "NGN" | "GBP" }
// Persists the signed-in user's billing-currency preference so it follows
// them across devices and browsers (beyond the 1-year cookie).
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currency = parseCurrency(body.currency);
  if (!currency) {
    return NextResponse.json(
      { error: "currency must be USD, NGN or GBP" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateUser(user.id, {
      preferredCurrency: currency as BillingCurrency,
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save preferences." },
      { status: 500 }
    );
  }
}
