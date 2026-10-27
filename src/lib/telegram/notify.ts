import { randomUUID } from "crypto";
import { and, eq, isNull, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { telegramConnection, telegramGroup, telegramMilestone, telegramOutbox } from "@/lib/db/schema";
import { isTelegramConfigured, sendTelegramMessage, type ReplyMarkup } from "@/lib/telegram/api";
import { formatBatchMessage } from "@/lib/telegram/batch";
import { getDestinations, type Destination } from "@/lib/telegram/destinations";
import { DIVIDER, formatEventMessage, type FormattedMessage, type TelegramEventInput } from "@/lib/telegram/format";
import { t, type Lang, type MessageKey } from "@/lib/telegram/i18n";

/**
 * Events arriving within this window are merged into a single message.
 * Keeps us far below Telegram's per-chat rate limit during bursts
 * (e.g. a 20-commit push or a wave of stars).
 */
const BATCH_WINDOW_MS = Number(process.env.TELEGRAM_BATCH_WINDOW_MS ?? 3000);

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* -------------------------------- delivery -------------------------------- */

async function dropUnreachable(userId: string, dest: Destination) {
  if (dest.kind === "private") {
    // User blocked the bot — drop the stale link so we stop trying.
    await db.delete(telegramConnection).where(eq(telegramConnection.userId, userId));
  } else {
    await db.delete(telegramGroup).where(eq(telegramGroup.chatId, dest.chatId));
  }
}

async function deliver(
  userId: string,
  destinations: Destination[],
  build: (lang: Lang) => { text: string; markup?: ReplyMarkup }
) {
  const cache = new Map<Lang, { text: string; markup?: ReplyMarkup }>();
  for (const dest of destinations) {
    if (!cache.has(dest.lang)) cache.set(dest.lang, build(dest.lang));
    const { text, markup } = cache.get(dest.lang)!;

    const result = await sendTelegramMessage(dest.chatId, text, { replyMarkup: markup });
    if (!result.ok && result.blocked) await dropUnreachable(userId, dest);
    else if (!result.ok) console.error("Telegram notification failed:", result.error);
  }
}

const toMarkup = (m: FormattedMessage): ReplyMarkup | undefined =>
  m.buttons.length > 0 ? { inline_keyboard: m.buttons } : undefined;

/* ------------------------------ milestones ------------------------------ */

async function celebrateMilestones(userId: string, events: TelegramEventInput[], destinations: Destination[]) {
  const candidates: { key: string; msg: MessageKey; vars: Record<string, string | number> }[] = [];

  for (const e of events) {
    if (e.eventType === "star" && e.action !== "deleted" && e.repositoryName) {
      const n = e.summary.starsCount;
      if (typeof n === "number" && MILESTONES.includes(n)) {
        candidates.push({ key: `stars:${e.repositoryName}:${n}`, msg: "ms.stars", vars: { repo: e.repositoryName, n } });
      }
    }
    if (e.eventType === "follower" && e.action !== "unfollowed") {
      const n = e.summary.followersAfter;
      if (typeof n === "number" && MILESTONES.includes(n)) {
        candidates.push({ key: `followers:${n}`, msg: "ms.followers", vars: { n } });
      }
    }
  }

  for (const c of candidates) {
    // The unique (user, key) index guarantees each milestone fires once.
    const inserted = await db
      .insert(telegramMilestone)
      .values({ id: randomUUID(), userId, key: c.key })
      .onConflictDoNothing()
      .returning({ id: telegramMilestone.id });
    if (inserted.length === 0) continue;

    await deliver(userId, destinations, (lang) => ({
      text: t(lang, c.msg, { ...c.vars, divider: DIVIDER }),
    }));
  }
}

/* ------------------------------ event queue ------------------------------ */

async function hasDestinations(userId: string): Promise<boolean> {
  return (await getDestinations(userId)).length > 0;
}

/** Adds an event to the user's outbox (no sending yet). */
export async function enqueueEventNotification(userId: string, event: TelegramEventInput) {
  if (!isTelegramConfigured()) return;
  try {
    if (!(await hasDestinations(userId))) return;
    await db.insert(telegramOutbox).values({
      id: randomUUID(),
      userId,
      repositoryName: event.repositoryName,
      eventType: event.eventType,
      action: event.action,
      actorLogin: event.actorLogin,
      summary: event.summary,
      url: event.url,
    });
  } catch (error) {
    console.error("Telegram enqueue error:", error);
  }
}

/**
 * Sends everything queued for the user. The rows are claimed with a single
 * atomic UPDATE … RETURNING, so when many invocations race only one of
 * them gets the rows and sends — duplicates are impossible.
 */
export async function flushUserOutbox(userId: string) {
  if (!isTelegramConfigured()) return;
  try {
    const claimed = await db
      .update(telegramOutbox)
      .set({ claimedAt: new Date() })
      .where(and(eq(telegramOutbox.userId, userId), isNull(telegramOutbox.claimedAt)))
      .returning();
    if (claimed.length === 0) return;

    const events: TelegramEventInput[] = claimed
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) => ({
        repositoryName: r.repositoryName,
        eventType: r.eventType,
        action: r.action,
        actorLogin: r.actorLogin,
        summary: r.summary,
        url: r.url,
        createdAt: r.createdAt,
      }));

    const destinations = await getDestinations(userId);
    if (destinations.length > 0) {
      await deliver(userId, destinations, (lang) => {
        const message: FormattedMessage =
          events.length === 1 ? formatEventMessage(events[0], lang) : formatBatchMessage(events, lang);
        return { text: message.text, markup: toMarkup(message) };
      });
      await celebrateMilestones(userId, events, destinations);
    }

    // Housekeeping: drop processed rows older than a day.
    await db
      .delete(telegramOutbox)
      .where(and(eq(telegramOutbox.userId, userId), lt(telegramOutbox.createdAt, new Date(Date.now() - 86_400_000))));
  } catch (error) {
    console.error("Telegram flush error:", error);
  }
}

/**
 * Webhook entry point: queue the event, wait one batching window so that
 * siblings from the same burst can join, then flush. Never throws.
 */
export async function scheduleEventNotification(userId: string, event: TelegramEventInput) {
  await enqueueEventNotification(userId, event);
  await sleep(BATCH_WINDOW_MS);
  await flushUserOutbox(userId);
}

/* ------------------------------ system alerts ------------------------------ */

/** Sends an immediate (non-batched) message to all of a user's chats. */
export async function notifyUserText(
  userId: string,
  build: (lang: Lang) => { text: string; buttons?: FormattedMessage["buttons"] }
) {
  if (!isTelegramConfigured()) return;
  try {
    const destinations = await getDestinations(userId);
    if (destinations.length === 0) return;
    await deliver(userId, destinations, (lang) => {
      const { text, buttons } = build(lang);
      return { text, markup: buttons && buttons.length > 0 ? { inline_keyboard: buttons } : undefined };
    });
  } catch (error) {
    console.error("Telegram alert error:", error);
  }
}

/** Backwards-compatible alias: one event, batched. */
export const notifyUserOfEvent = scheduleEventNotification;
