import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listPaymentsForUser } from "@/lib/store";

// GET /api/billing/history — the signed-in user's checkout/payment history
// (pending + settled), newest first.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await listPaymentsForUser(user.id);
    return NextResponse.json({ payments });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load payment history." },
      { status: 500 }
    );
  }
}
