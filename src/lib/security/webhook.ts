import { createHmac } from "crypto";
import { timingSafeEqualString } from "./crypto";

/**
 * Verifies a GitHub webhook payload against its X-Hub-Signature-256
 * header using the app's webhook secret. Must be run against the RAW
 * request body (not a re-serialized JSON.parse output), since GitHub
 * signs the exact bytes it sent.
 */
export function verifyGithubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const expectedSignature =
    "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  return timingSafeEqualString(signatureHeader, expectedSignature);
}
