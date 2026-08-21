import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getUserByIdWithHash, updatePasswordHash } from "@/lib/store";

// PATCH /api/auth/password { currentPassword?, newPassword }
// Changes the signed-in user's password (or sets one for the first time on a
// LinkedIn-only account). Existing passwords are confirmed first; the new hash
// is always written as Argon2id.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const newPassword = body.newPassword ?? "";
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  try {
    const full = await getUserByIdWithHash(user.id);
    if (!full) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (full.hasPassword) {
      const currentPassword = body.currentPassword ?? "";
      if (!(await verifyPassword(currentPassword, full.passwordHash))) {
        return NextResponse.json(
          { error: "Your current password is incorrect." },
          { status: 401 }
        );
      }
    }

    await updatePasswordHash(user.id, await hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("change password:", err);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}
