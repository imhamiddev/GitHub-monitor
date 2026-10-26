import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { telegramConnection } from "@/lib/db/schema";
import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/api";
import { formatEventMessage, type TelegramEventInput } from "@/lib/telegram/format";

/**
 * Pushes an event to the user's linked Telegram chat, if any.
 * Never throws — a Telegram outage must not break webhook processing.
 */
export async function notifyUserOfEvent(userId: string, event: TelegramEventInput) {
  if (!isTelegramConfigured()) return;

  try {
    const connection = await db.query.telegramConnection.findFirst({
      where: and(
        eq(telegramConnection.userId, userId),
        isNotNull(telegramConnection.chatId),
        eq(telegramConnection.notificationsEnabled, true)
      ),
    });
    if (!connection?.chatId) return;

    const result = await sendTelegramMessage(connection.chatId, formatEventMessage(event));

    if (!result.ok && result.blocked) {
      // User blocked the bot — drop the stale link so we stop trying.
      await db.delete(telegramConnection).where(eq(telegramConnection.userId, userId));
    } else if (!result.ok) {
      console.error("Telegram notification failed:", result.error);
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}
