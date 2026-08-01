import "server-only";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/firebase";

/**
 * Firebase Firestore persistence layer.
 *
 * Every exported function keeps the same signature the JSON-file store had,
 * so no route or component changes when swapping databases. Collection names
 * mirror the old DbShape:
 *
 *   users[userId]                -> UserRecord (password scrypt hash)
 *   sessions[token]              -> SessionRecord
 *   posts[postId]                -> PostRecord
 *   connectedAccountEvents[auto] -> account.connected webhook events
 *   profiles[userId]             -> userId -> Zernio profileId mapping
 */

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ----------------------------- Collections ------------------------------ */

const db = () => getDb();
const users = () => db().collection("users");
const sessions = () => db().collection("sessions");
const posts = () => db().collection("posts");
const events = () => db().collection("connectedAccountEvents");
const profiles = () => db().collection("profiles");

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

interface PostRecord {
  id: string; // Zernio post id
  userId: string; // app userId
  caption: string;
  socialAccountIds: string[];
  status: string;
  createdAt: string;
}

/* --------------------------------- Users -------------------------------- */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function toPublicUser(u: UserRecord): PublicUser {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<PublicUser> {
  const user: UserRecord = {
    id: `user_${randomUUID()}`,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  await users().doc(user.id).set(user);
  return toPublicUser(user);
}

export async function findUserByEmail(
  email: string
): Promise<(PublicUser & { passwordHash: string }) | null> {
  const snap = await users()
    .where("email", "==", email.trim().toLowerCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0].data() as UserRecord;
  return { ...toPublicUser(doc), passwordHash: doc.passwordHash };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const snap = await users().doc(id).get();
  if (!snap.exists) return null;
  return toPublicUser(snap.data() as UserRecord);
}

export async function updateUser(
  id: string,
  patch: { name?: string }
): Promise<PublicUser | null> {
  const doc = users().doc(id);
  const snap = await doc.get();
  if (!snap.exists) return null;
  const current = snap.data() as UserRecord;
  const updated: UserRecord = {
    ...current,
    name: patch.name?.trim() || current.name,
  };
  await doc.set(updated);
  return toPublicUser(updated);
}

/* ------------------------------- Sessions ------------------------------- */

export async function createSession(userId: string, token: string) {
  await sessions().doc(token).set({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
}

export async function getSession(
  token: string
): Promise<SessionRecord | null> {
  const snap = await sessions().doc(token).get();
  if (!snap.exists) return null;
  const session = snap.data() as SessionRecord;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return session;
}

export async function deleteSession(token: string) {
  await sessions().doc(token).delete();
}

/* --------------------------------- Posts -------------------------------- */

export async function recordPost(record: PostRecord) {
  await posts().doc(record.id).set(record);
}

export async function listPostsForUser(userId: string): Promise<PostRecord[]> {
  // Sorted in memory so no composite Firestore index is required.
  const snap = await posts().where("userId", "==", userId).get();
  return snap.docs
    .map((d) => d.data() as PostRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ----------------------------- Account events --------------------------- */

/** Called from the Zernio webhook when account.connected fires. */
export async function recordAccountConnected(entry: {
  userId: string;
  accountId: string;
  platform: string;
}) {
  await events().add({
    ...entry,
    receivedAt: new Date().toISOString(),
  });
}

/* ----------------------------- Profile mapping -------------------------- */

export async function getProfileForUser(userId: string): Promise<string | null> {
  const snap = await profiles().doc(userId).get();
  if (!snap.exists) return null;
  return (snap.data() as { profileId: string }).profileId;
}

export async function setProfileForUser(userId: string, profileId: string) {
  await profiles().doc(userId).set({ userId, profileId });
}
