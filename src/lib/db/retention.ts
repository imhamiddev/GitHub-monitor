import { and, isNull, isNotNull, like, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  rateLimit,
  session,
  telegramConnection,
  telegramMilestone,
  telegramOutbox,
  verification,
  webhookDelivery,
} from "@/lib/db/schema";

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

export type RetentionResult = Record<string, number>;

/**
 * Keeps the database from growing without bound. Every rule is idempotent
 * and only touches data that is no longer useful:
 *
 * - webhook_delivery: raw payloads are debug-only → cleared after 3 days;
 *   the row itself (used for replay de-duplication) is kept for 30 days.
 * - telegram_outbox: processed within seconds → purged after 1 day.
 * - telegram_milestone: the daily "unreachable" dedupe keys → 7 days.
 *   (Real milestones are kept forever so they never fire twice.)
 * - telegram_connection: expired link tokens are cleared and abandoned
 *   pending links (never confirmed) are deleted after 1 day.
 * - session / verification / rate_limit: expired or stale auth rows.
 */
export async function runRetention(): Promise<RetentionResult> {
  const result: RetentionResult = {};

  const payloads = await db
    .update(webhookDelivery)
    .set({ rawPayload: null })
    .where(and(lt(webhookDelivery.processedAt, ago(3)), isNotNull(webhookDelivery.rawPayload)))
    .returning({ id: webhookDelivery.id });
  result.webhookPayloadsCleared = payloads.length;

  const deliveries = await db
    .delete(webhookDelivery)
    .where(lt(webhookDelivery.processedAt, ago(30)))
    .returning({ id: webhookDelivery.id });
  result.webhookDeliveriesDeleted = deliveries.length;

  const outbox = await db
    .delete(telegramOutbox)
    .where(lt(telegramOutbox.createdAt, ago(1)))
    .returning({ id: telegramOutbox.id });
  result.telegramOutboxDeleted = outbox.length;

  const milestones = await db
    .delete(telegramMilestone)
    .where(and(like(telegramMilestone.key, "health:unreachable:%"), lt(telegramMilestone.reachedAt, ago(7))))
    .returning({ id: telegramMilestone.id });
  result.telegramHealthKeysDeleted = milestones.length;

  const tokens = await db
    .update(telegramConnection)
    .set({ linkTokenHash: null, linkTokenExpiresAt: null })
    .where(and(isNotNull(telegramConnection.linkTokenHash), lt(telegramConnection.linkTokenExpiresAt, new Date())))
    .returning({ userId: telegramConnection.userId });
  result.telegramExpiredTokensCleared = tokens.length;

  const pending = await db
    .delete(telegramConnection)
    .where(and(isNull(telegramConnection.chatId), lt(telegramConnection.createdAt, ago(1))))
    .returning({ userId: telegramConnection.userId });
  result.telegramPendingLinksDeleted = pending.length;

  const sessions = await db
    .delete(session)
    .where(lt(session.expiresAt, new Date()))
    .returning({ id: session.id });
  result.expiredSessionsDeleted = sessions.length;

  const verifications = await db
    .delete(verification)
    .where(lt(verification.expiresAt, new Date()))
    .returning({ id: verification.id });
  result.expiredVerificationsDeleted = verifications.length;

  // lastRequest is epoch millis; nothing older than a day matters for rate limiting.
  const limits = await db
    .delete(rateLimit)
    .where(lt(rateLimit.lastRequest, Date.now() - DAY))
    .returning({ id: rateLimit.id });
  result.staleRateLimitsDeleted = limits.length;

  return result;
}
