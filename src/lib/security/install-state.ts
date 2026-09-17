import { createHmac, randomBytes } from "crypto";
import { timingSafeEqualString } from "./crypto";

/**
 * Generates a signed, short-lived state token to protect the GitHub App
 * installation flow from CSRF: we bind the state to the current user's
 * session id and a timestamp, sign it with a server-only secret, and
 * verify both the signature and expiry on callback.
 */
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty for an install flow

function getStateSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return secret;
}

export function createInstallState(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}.${nonce}`;
  const signature = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyInstallState(
  state: string,
  expectedUserId: string
): { valid: boolean; reason?: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const parts = decoded.split(".");
  if (parts.length !== 4) return { valid: false, reason: "malformed" };
  const [userId, timestamp, nonce, signature] = parts;

  const payload = `${userId}.${timestamp}.${nonce}`;
  const expectedSignature = createHmac("sha256", getStateSecret())
    .update(payload)
    .digest("hex");

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return { valid: false, reason: "bad_signature" };
  }

  if (userId !== expectedUserId) {
    return { valid: false, reason: "user_mismatch" };
  }

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > STATE_TTL_MS) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true };
}
