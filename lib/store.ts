import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Minimal file-backed persistence standing in for your "Custom Backend"
 * database. It stores per-user post history and account nicknames that
 * live in YOUR system (Post for Me remains the source of truth for OAuth
 * tokens and account status).
 *
 * Swap this module for Prisma + Postgres/MySQL in production — every
 * function signature below is what a real ORM layer would expose, so
 * nothing else in the app needs to change.
 */

const DATA_FILE = path.join(process.cwd(), "data", "db.json");

interface PostRecord {
  id: string; // Post for Me social_post id
  userId: string; // Clerk userId
  caption: string;
  socialAccountIds: string[];
  status: string;
  createdAt: string;
}

interface DbShape {
  posts: PostRecord[];
  connectedAccountEvents: Array<{
    userId: string;
    accountId: string;
    platform: string;
    receivedAt: string;
  }>;
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { posts: [], connectedAccountEvents: [] };
  }
}

async function writeDb(db: DbShape) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

export async function recordPost(record: PostRecord) {
  const db = await readDb();
  db.posts.unshift(record);
  await writeDb(db);
}

export async function listPostsForUser(userId: string) {
  const db = await readDb();
  return db.posts.filter((p) => p.userId === userId);
}

/** Called from the Post for Me webhook when social.account.created fires. */
export async function recordAccountConnected(entry: {
  userId: string;
  accountId: string;
  platform: string;
}) {
  const db = await readDb();
  db.connectedAccountEvents.unshift({
    ...entry,
    receivedAt: new Date().toISOString(),
  });
  await writeDb(db);
}
