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
const payments = () => db().collection("payments");

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  plan?: "free" | "business" | "pro" | "team";
  /** When a paid plan expires; paid plans auto-downgrade to free after this. */
  planExpiresAt?: string;
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
  plan: "free" | "business" | "pro" | "team";
}

function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    plan: u.plan ?? "free",
  };
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
    plan: "free",
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

export async function updatePasswordHash(id: string, passwordHash: string) {
  await users().doc(id).update({ passwordHash });
}

export async function setUserPlan(userId: string, plan: "free" | "business" | "pro" | "team") {
  await users().doc(userId).update({ plan });
}

export async function getUserPlan(userId: string): Promise<"free" | "business" | "pro" | "team"> {
  const snap = await users().doc(userId).get();
  if (!snap.exists) return "free";
  return ((snap.data() as UserRecord).plan as "free" | "business" | "pro" | "team") ?? "free";
}

export async function getUserPlanStatus(
  userId: string
): Promise<{ plan: "free" | "business" | "pro" | "team"; planExpiresAt: string | null }> {
  const snap = await users().doc(userId).get();
  if (!snap.exists) return { plan: "free", planExpiresAt: null };
  const rec = snap.data() as UserRecord;
  return { plan: rec.plan ?? "free", planExpiresAt: rec.planExpiresAt ?? null };
}

export async function getPlanExpiry(userId: string): Promise<string | null> {
  const snap = await users().doc(userId).get();
  if (!snap.exists) return null;
  return (snap.data() as UserRecord).planExpiresAt ?? null;
}

/**
 * Activate (or extend) a paid plan for `days`. If the user already has an
 * active subscription, renewal extends from the current expiry instead of
 * overwriting it, so early renewals stack.
 */
export async function activatePlan(
  userId: string,
  plan: "free" | "business" | "pro" | "team",
  days: number
) {
  const { planExpiresAt } = await getUserPlanStatus(userId);
  const base =
    planExpiresAt && new Date(planExpiresAt).getTime() > Date.now()
      ? new Date(planExpiresAt).getTime()
      : Date.now();
  const expiresAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  await users().doc(userId).update({ plan, planExpiresAt: expiresAt });
}

/* ------------------------------- Payments ------------------------------- */

interface PaymentRecord {
  txRef: string;
  userId: string;
  planId: "free" | "business" | "pro" | "team";
  amount: number;
  currency: string;
  status: "pending" | "success";
  flutterwaveTransactionId?: string;
  createdAt: string;
  settledAt?: string;
}

/** Record a checkout that was started (pending) or settled (success). */
export async function recordPayment(record: PaymentRecord) {
  await payments().doc(record.txRef).set(record);
}

export async function getPaymentByTxRef(txRef: string): Promise<PaymentRecord | null> {
  const snap = await payments().doc(txRef).get();
  if (!snap.exists) return null;
  return snap.data() as PaymentRecord;
}

export async function markPaymentSuccess(
  txRef: string,
  patch: { flutterwaveTransactionId?: string; settledAt: string }
) {
  await payments().doc(txRef).update({ status: "success", ...patch });
}

/** True when the user has settled at least one payment (drives first-timer pricing). */
export async function hasPriorPayment(userId: string): Promise<boolean> {
  const snap = await payments()
    .where("userId", "==", userId)
    .where("status", "==", "success")
    .limit(1)
    .get();
  return !snap.empty;
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

/**
 * Update a stored post's status (e.g. scheduled -> published) when a post.*
 * webhook fires. When userId is supplied it's used to verify the post belongs
 * to that user; otherwise the signature-verified webhook is trusted directly.
 */
export async function updatePostStatus(postId: string, status: string, userId?: string) {
  const ref = posts().doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const rec = snap.data() as PostRecord;
  if (userId && rec.userId !== userId) return;
  await ref.update({ status });
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

/* ------------------------------ Competitors ----------------------------- */
/* Manually tracked competitor accounts, stored per app user. Follower
 * snapshots are collected by the UI calling /api/social/competitors when the
 * user views the compare view. */

export interface CompetitorRecord {
  id: string;
  userId: string;
  platform: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  followerSnapshots: { date: string; followers: number }[];
  createdAt: string;
}

const competitors = () => db().collection("competitors");

/** Drop undefined values so Firestore accepts the document. */
function compact<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export async function listCompetitors(userId: string): Promise<CompetitorRecord[]> {
  const snap = await competitors().where("userId", "==", userId).get();
  return snap.docs
    .map((d) => d.data() as CompetitorRecord)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function getCompetitor(userId: string, id: string): Promise<CompetitorRecord | null> {
  const snap = await competitors().doc(id).get();
  if (!snap.exists) return null;
  const rec = snap.data() as CompetitorRecord;
  if (rec.userId !== userId) return null;
  return rec;
}

export async function createCompetitor(
  userId: string,
  input: {
    platform: string;
    username: string;
    displayName?: string;
    profileUrl?: string;
  }
): Promise<CompetitorRecord> {
  const id = randomUUID();
  const rec: CompetitorRecord = {
    id,
    userId,
    platform: input.platform,
    username: input.username,
    displayName: input.displayName,
    profileUrl: input.profileUrl,
    followerSnapshots: [],
    createdAt: new Date().toISOString(),
  };
  await competitors().doc(id).set(compact(rec));
  return rec;
}

export async function updateCompetitor(
  userId: string,
  id: string,
  patch: Partial<Pick<CompetitorRecord, "platform" | "username" | "displayName" | "profileUrl">>
): Promise<CompetitorRecord | null> {
  const rec = await getCompetitor(userId, id);
  if (!rec) return null;
  const next = { ...rec, ...patch, followerSnapshots: rec.followerSnapshots };
  await competitors().doc(id).set(compact(next));
  return next;
}

export async function addCompetitorSnapshot(
  userId: string,
  id: string,
  followers: number,
  date = new Date().toISOString().slice(0, 10)
): Promise<CompetitorRecord | null> {
  const rec = await getCompetitor(userId, id);
  if (!rec) return null;
  const previous = rec.followerSnapshots.find((s) => s.date === date);
  const next: CompetitorRecord = {
    ...rec,
    followerSnapshots: previous
      ? rec.followerSnapshots.map((s) => (s.date === date ? { ...s, followers } : s))
      : [...rec.followerSnapshots, { date, followers }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
  };
  await competitors().doc(id).set(next);
  return next;
}

export async function deleteCompetitor(userId: string, id: string): Promise<boolean> {
  const rec = await getCompetitor(userId, id);
  if (!rec) return false;
  await competitors().doc(id).delete();
  return true;
}
