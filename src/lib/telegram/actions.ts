"use server";

import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { telegramConnection } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { buildBotLink, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/api";
import { guestKeyboard } from "@/lib/telegram/keyboards";
import { resolveLang } from "@/lib/telegram/prefs";
import {
  createLinkToken,
  getTelegramConnection,
  listGroups,
  removeGroup,
  unlinkByUserId,
} from "@/lib/telegram/connection";
import { getBotUsername } from "@/lib/telegram/api";

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user.id ?? null;
}

export async function generateTelegramLink(): Promise<
  ActionResult<{ link: string; qrDataUrl: string; expiresAt: string }>
> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  if (!isTelegramConfigured()) {
    return { success: false, error: "Telegram bot is not configured on this server." };
  }

  const { token, expiresAt } = await createLinkToken(userId);
  const link = buildBotLink(token);
  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return { success: true, link, qrDataUrl, expiresAt: expiresAt.toISOString() };
}

export async function disconnectTelegram(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const connection = await getTelegramConnection(userId);
  if (connection?.chatId) {
    await sendTelegramMessage(
      connection.chatId,
      "🔌 <b>Disconnected</b>\nThis chat was unlinked from your GitHub Monitor account. You will no longer receive notifications.\n\nSend /start to set things up again.",
      { replyMarkup: guestKeyboard(await resolveLang(connection.chatId, null)) }
    );
  }
  await unlinkByUserId(userId);

  revalidatePath("/settings/telegram");
  return { success: true };
}

export async function setTelegramNotifications(enabled: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  await db
    .update(telegramConnection)
    .set({ notificationsEnabled: enabled, updatedAt: new Date() })
    .where(eq(telegramConnection.userId, userId));

  revalidatePath("/settings/telegram");
  return { success: true };
}

export async function sendTelegramTestMessage(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const connection = await getTelegramConnection(userId);
  if (!connection?.chatId) return { success: false, error: "Telegram is not connected." };

  const result = await sendTelegramMessage(
    connection.chatId,
    "✅ <b>Test notification</b>\n━━━━━━━━━━━━━━━━\nGitHub Monitor can reach you here. Everything is working! 🎉"
  );
  return result.ok ? { success: true } : { success: false, error: "Could not deliver the message." };
}

/** Lightweight status read used by the settings card to detect a completed link. */
export async function getTelegramStatus(): Promise<{ connected: boolean }> {
  const userId = await requireUserId();
  if (!userId) return { connected: false };
  const connection = await getTelegramConnection(userId);
  return { connected: Boolean(connection?.chatId) };
}

/**
 * One-time token for adding the bot to a group (deep link that opens the
 * group picker) or a channel (admin posts the `/link <token>` command).
 */
export async function generateTelegramGroupLink(): Promise<
  ActionResult<{ groupLink: string; channelCommand: string; expiresAt: string }>
> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  if (!isTelegramConfigured()) {
    return { success: false, error: "Telegram bot is not configured on this server." };
  }

  const { token, expiresAt } = await createLinkToken(userId);
  return {
    success: true,
    groupLink: `https://t.me/${getBotUsername()}?startgroup=${encodeURIComponent(token)}`,
    channelCommand: `/link ${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function removeTelegramGroup(groupId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  await removeGroup(userId, groupId);
  revalidatePath("/settings/telegram");
  return { success: true };
}

/** Lets the settings card detect a newly linked group while it waits. */
export async function getTelegramGroupCount(): Promise<number> {
  const userId = await requireUserId();
  if (!userId) return 0;
  return (await listGroups(userId)).length;
}
