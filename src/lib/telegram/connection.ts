import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { telegramConnection } from "@/lib/db/schema";

export const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getTelegramConnection(userId: string) {
  return db.query.telegramConnection.findFirst({
    where: eq(telegramConnection.userId, userId),
  });
}

/** Creates (or replaces) a one-time link token valid for 15 minutes. */
export async function createLinkToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  // 24 random bytes → 32 URL-safe chars; fits Telegram's /start param rules.
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);
  const now = new Date();

  await db
    .insert(telegramConnection)
    .values({
      userId,
      linkTokenHash: hashToken(token),
      linkTokenExpiresAt: expiresAt,
    })
    .onConflictDoUpdate({
      target: telegramConnection.userId,
      set: {
        linkTokenHash: hashToken(token),
        linkTokenExpiresAt: expiresAt,
        updatedAt: now,
      },
    });

  return { token, expiresAt };
}

export type CompleteLinkResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "chat_in_use" };

/** Called by the bot webhook when a user opens the deep link. */
export async function completeLink(
  token: string,
  chat: { chatId: string; username: string | null; firstName: string | null }
): Promise<CompleteLinkResult> {
  const row = await db.query.telegramConnection.findFirst({
    where: and(
      eq(telegramConnection.linkTokenHash, hashToken(token)),
      gt(telegramConnection.linkTokenExpiresAt, new Date())
    ),
  });
  if (!row) return { ok: false, reason: "invalid" };

  // One Telegram chat can belong to only one account.
  const existing = await db.query.telegramConnection.findFirst({
    where: eq(telegramConnection.chatId, chat.chatId),
  });
  if (existing && existing.userId !== row.userId) {
    return { ok: false, reason: "chat_in_use" };
  }

  await db
    .update(telegramConnection)
    .set({
      chatId: chat.chatId,
      telegramUsername: chat.username,
      telegramFirstName: chat.firstName,
      linkTokenHash: null,
      linkTokenExpiresAt: null,
      notificationsEnabled: true,
      connectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(telegramConnection.userId, row.userId));

  return { ok: true };
}

export async function unlinkByUserId(userId: string) {
  await db.delete(telegramConnection).where(eq(telegramConnection.userId, userId));
}

export async function unlinkByChatId(chatId: string): Promise<boolean> {
  const deleted = await db
    .delete(telegramConnection)
    .where(eq(telegramConnection.chatId, chatId))
    .returning({ userId: telegramConnection.userId });
  return deleted.length > 0;
}
