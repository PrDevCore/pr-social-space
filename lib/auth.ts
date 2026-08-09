import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { hash as argon2hash, verify as argon2verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import {
  createSession,
  deleteSession,
  getSession,
  getUserById,
} from "@/lib/store";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds, matches SESSION_TTL_MS

/* ------------------------- Passwords (Argon2id + pepper) ---------------- */
/*
 * Argon2id is the current state-of-the-art password KDF: memory-hard and
 * resistant to GPU/ASIC offline attacks. Parameters follow the OWASP
 * recommendation (m=19 MiB, t=2, p=1). A server-side pepper (PASSWORD_PEPPER)
 * is prepended before hashing so a DB leak alone can't be brute-forced.
 *
 * Legacy scrypt hashes are still verified for existing accounts and are
 * transparently upgraded to Argon2id on the next successful login.
 */

/* OWASP-recommended Argon2id parameters. */
const ARGON_MEMORY = 19456; // KiB (~19 MiB)
const ARGON_TIME = 2;
const ARGON_PARALLELISM = 1;

function peppered(password: string): string {
  const pepper = process.env.PASSWORD_PEPPER;
  return pepper ? `${pepper}${password}` : password;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2hash(peppered(password), {
    memoryCost: ARGON_MEMORY,
    timeCost: ARGON_TIME,
    parallelism: ARGON_PARALLELISM,
  });
}

/** True when the stored hash predates Argon2 and should be rehashed after a successful login. */
export function passwordNeedsRehash(stored: string): boolean {
  return !stored.startsWith("$argon2");
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  if (stored.startsWith("$argon2")) {
    return argon2verify(stored, peppered(password));
  }
  // Legacy scrypt format: "<salt>:<hash>".
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(peppered(password), salt, 64);
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