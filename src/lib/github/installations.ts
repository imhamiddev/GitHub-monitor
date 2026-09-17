import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubInstallation } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/security/crypto";

export async function getInstallationForUser(userId: string) {
  return db.query.githubInstallation.findFirst({
    where: and(
      eq(githubInstallation.userId, userId),
      eq(githubInstallation.status, "active")
    ),
  });
}

export async function getInstallationById(id: string) {
  return db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.id, id),
  });
}

export async function getInstallationByGithubId(installationId: number) {
  return db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.installationId, installationId),
  });
}

export async function upsertInstallation(params: {
  userId: string;
  installationId: number;
  githubAccountId: number;
  githubAccountLogin: string;
  githubAccountType: string;
}) {
  const existing = await getInstallationByGithubId(params.installationId);

  if (existing) {
    const [updated] = await db
      .update(githubInstallation)
      .set({
        userId: params.userId,
        githubAccountLogin: params.githubAccountLogin,
        githubAccountType: params.githubAccountType,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(githubInstallation.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(githubInstallation)
    .values({
      id: randomUUID(),
      userId: params.userId,
      installationId: params.installationId,
      githubAccountId: params.githubAccountId,
      githubAccountLogin: params.githubAccountLogin,
      githubAccountType: params.githubAccountType,
      status: "active",
    })
    .returning();
  return created;
}

export async function cacheInstallationToken(
  installationDbId: string,
  token: string,
  expiresAt: Date
) {
  await db
    .update(githubInstallation)
    .set({
      encryptedAccessToken: encrypt(token),
      accessTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(githubInstallation.id, installationDbId));
}

/**
 * Returns a cached installation token only if it still has a safety
 * margin before expiry; otherwise returns null so the caller fetches
 * a fresh one from GitHub. Never returns an expired/near-expired token.
 */
export function getCachedTokenIfFresh(row: {
  encryptedAccessToken: string | null;
  accessTokenExpiresAt: Date | null;
}): string | null {
  if (!row.encryptedAccessToken || !row.accessTokenExpiresAt) return null;
  const SAFETY_MARGIN_MS = 60 * 1000; // 1 minute
  if (row.accessTokenExpiresAt.getTime() - Date.now() < SAFETY_MARGIN_MS) {
    return null;
  }
  return decrypt(row.encryptedAccessToken);
}

export async function markInstallationRevoked(installationId: number) {
  await db
    .update(githubInstallation)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(githubInstallation.installationId, installationId));
}

export async function deleteInstallation(id: string, userId: string) {
  await db
    .delete(githubInstallation)
    .where(and(eq(githubInstallation.id, id), eq(githubInstallation.userId, userId)));
}
