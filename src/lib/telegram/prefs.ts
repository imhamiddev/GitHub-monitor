import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { telegramChatPref } from "@/lib/db/schema";
import { langFromCode, type Lang } from "@/lib/telegram/i18n";

export async function getStoredLanguage(chatId: string): Promise<Lang | null> {
  const row = await db.query.telegramChatPref.findFirst({
    where: eq(telegramChatPref.chatId, chatId),
  });
  return row?.language === "fa" || row?.language === "en" ? row.language : null;
}

/** Stored preference, falling back to the Telegram client's language. */
export async function resolveLang(chatId: string, languageCode?: string | null): Promise<Lang> {
  return (await getStoredLanguage(chatId)) ?? langFromCode(languageCode);
}

export async function setChatLanguage(chatId: string, language: Lang) {
  await db
    .insert(telegramChatPref)
    .values({ chatId, language })
    .onConflictDoUpdate({
      target: telegramChatPref.chatId,
      set: { language, updatedAt: new Date() },
    });
}
