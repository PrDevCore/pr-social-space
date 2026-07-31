import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  createSession,
  deleteSession,
  getSession,
  getUserById,
} from "@/lib/store";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds, matches SESSION_TTL_MS

/* ---------------------------- Passwords (scrypt) ------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

/* ------------------------------- Sessions ------------------------------- */

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Returns the signed-in user, or null. Reads the session cookie and
 * validates it against the store. Server-side only. Returns null if storage
 * isn't configured yet so pages render instead of crashing.
 */
export async function getCurrentUser() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await getSession(token);
    if (!session) return null;
    return getUserById(session.userId);
  } catch {
    return null;
  }
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
}
