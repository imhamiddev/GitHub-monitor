import { createHmac, randomBytes } from "crypto";
import { timingSafeEqualString } from "./crypto";

/**
 * Generates a signed, short-lived state token to protect the GitHub App
 * installation flow from CSRF: we bind the state to the current user's
 * session id, a timestamp, and where to send them back to afterward,
 * sign it with a server-only secret, and verify both the signature and
 * expiry on callback.
 */
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty for an install flow

// Only these destinations are ever allowed — returnTo is carried inside
// a signed token, but we still whitelist it rather than trust an open
// string, so this can never become an open-redirect vector even if the
// signing secret were somehow compromised.
const ALLOWED_RETURN_TARGETS = ["settings", "onboarding"] as const;
export type InstallReturnTarget = (typeof ALLOWED_RETURN_TARGETS)[number];

function getStateSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return secret;
}

export function createInstallState(
  userId: string,
  returnTo: InstallReturnTarget = "settings"
): string {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}.${nonce}.${returnTo}`;
  const signature = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyInstallState(
  state: string,
  expectedUserId: string
): { valid: boolean; reason?: string; returnTo?: InstallReturnTarget } {
  let decoded: string;
  try {
    decoded = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const parts = decoded.split(".");
  if (parts.length !== 5) return { valid: false, reason: "malformed" };
  const [userId, timestamp, nonce, returnTo, signature] = parts;

  const payload = `${userId}.${timestamp}.${nonce}.${returnTo}`;
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

  if (!ALLOWED_RETURN_TARGETS.includes(returnTo as InstallReturnTarget)) {
    return { valid: false, reason: "invalid_return_target" };
  }

  return { valid: true, returnTo: returnTo as InstallReturnTarget };
}
