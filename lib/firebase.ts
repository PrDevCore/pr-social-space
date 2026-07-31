import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin bootstrap. Credentials come from a service
 * account key (Firebase console -> Project settings -> Service accounts ->
 * Generate new private key). Only used by lib/store.ts — nothing else in
 * the app touches Firebase directly.
 *
 * Env vars:
 *   FIREBASE_PROJECT_ID    e.g. "social-hub-12345"
 *   FIREBASE_CLIENT_EMAIL  e.g. "firebase-adminsdk-xxxx@social-hub-12345.iam.gserviceaccount.com"
 *   FIREBASE_PRIVATE_KEY   the multiline "BEGIN PRIVATE KEY" blob. In .env
 *                          files write it on ONE line with \n escapes; the
 *                          \\n -> \n replacement below handles that.
 */

function assertConfigured() {
  const missing = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ].filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(
      `Firebase is not configured. Set ${missing.join(", ")} (see .env.example).`
    );
  }
}

function getAppInstance(): App {
  if (getApps().length > 0) return getApp();
  assertConfigured();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export function getDb() {
  return getFirestore(getAppInstance());
}
