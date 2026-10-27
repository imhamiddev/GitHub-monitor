import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { telegramConnection, telegramGroup } from "@/lib/db/schema";
import type { Lang } from "@/lib/telegram/i18n";
import { getStoredLanguage } from "@/lib/telegram/prefs";

export type Destination = {
  chatId: string;
  kind: "private" | "group";
  lang: Lang;
};

/**
 * Every chat that should receive a user's notifications: their private
 * chat (when linked and not paused) plus all enabled groups/channels.
 * A group uses its own language, falling back to the owner's.
 */
export async function getDestinations(userId: string): Promise<Destination[]> {
  const [connection, groups] = await Promise.all([
    db.query.telegramConnection.findFirst({ where: eq(telegramConnection.userId, userId) }),
    db.query.telegramGroup.findMany({
      where: and(eq(telegramGroup.userId, userId), eq(telegramGroup.enabled, true)),
    }),
  ]);

  const ownerLang: Lang = connection?.chatId ? ((await getStoredLanguage(connection.chatId)) ?? "en") : "en";
  const result: Destination[] = [];

  if (connection?.chatId && connection.notificationsEnabled) {
    result.push({ chatId: connection.chatId, kind: "private", lang: ownerLang });
  }
  for (const group of groups) {
    result.push({
      chatId: group.chatId,
      kind: "group",
      lang: (await getStoredLanguage(group.chatId)) ?? ownerLang,
    });
  }
  return result;
}
