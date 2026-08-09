import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  passwordNeedsRehash,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { createSession, findUserByEmail, updatePasswordHash } from "@/lib/store";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Upgrade legacy scrypt hashes to Argon2id on successful login.
    if (passwordNeedsRehash(user.passwordHash)) {
      await updatePasswordHash(user.id, await hashPassword(password));
    }

    const token = createSessionToken();
    await createSession(user.id, token);

    const { passwordHash: _omit, ...safeUser } = user;
    const res = NextResponse.json({ user: safeUser });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("login:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
