import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { findUserByEmail, getUserByIdWithHash, updateUser } from "@/lib/store";

// PATCH /api/auth/profile { name?, email?, currentPassword? }
// Updates the signed-in user's profile. Changing the email requires the
// current password as confirmation (accounts that only log in via LinkedIn
// must set a password first — see /api/auth/password).
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; email?: string; currentPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const currentPassword = body.currentPassword ?? "";

  if (!name && !email) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  const patch: { name?: string; email?: string } = {};
  if (name) patch.name = name;

  if (email && email !== user.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!user.hasPassword) {
      return NextResponse.json(
        {
          error:
            "Set a password first (below), then you can change your email.",
        },
        { status: 400 }
      );
    }
    const full = await getUserByIdWithHash(user.id);
    if (
      !full ||
      !currentPassword ||
      !(await verifyPassword(currentPassword, full.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Enter your current password to change your email." },
        { status: 401 }
      );
    }
    const existing = await findUserByEmail(email);
    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    patch.email = email;
  }

  try {
    const updated = await updateUser(user.id, patch);
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
